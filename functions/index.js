/**
 * 🌍 AkiliPesa Cloud Automation — Firebase Functions (CommonJS Safe Version)
 *
 * Features:
 *  ✅ onUserCreate → Auto role, profile, wallet, trust, akiliPoints, welcome reward, notifications, and email
 *  ✅ onUserUpdate → Re-sync role and profile
 *  ✅ onUserDelete → Clean up Firestore and notify admin
 *  ✅ onUserLogin → Update last login, award first-login bonus, and notify user
 *  ✅ onWalletUpdate → Log balance changes and notify
 *  ✅ Analytics hooks → store key activities for insights
 *  ✅ Optional email integration via SendGrid or Gmail Firebase Extension
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;

// ─────────────────────────────
// 🔹 Utility: Determine Role
// ─────────────────────────────
function determineRole(user) {
  const email = (user.email || "").toLowerCase();
  const name = (user.displayName || "").toLowerCase();
  if (email.includes("paulinajshao") || email.includes("admin@akilipesa")) return "admin";
  if (email.includes("agent") || name.includes("agent")) return "agent";
  return "customer";
}

// ─────────────────────────────
// 🔹 Utility: Send Firestore Notification
// ─────────────────────────────
async function sendNotification(userId, title, message, type = "system") {
  const ref = db.collection("notifications").doc();
  await ref.set({
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`🔔 Notification: ${title} → ${userId}`);
}

// ─────────────────────────────
// 🔹 Utility: Send Email (requires SendGrid or Gmail Extension)
// ─────────────────────────────
async function sendEmail(recipient, subject, text) {
  try {
    const ref = db.collection("mail").doc();
    await ref.set({
      to: recipient,
      message: { subject, text },
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`📧 Email queued for ${recipient}`);
  } catch (err) {
    console.warn("⚠️ Email skipped (extension not configured).");
  }
}

// ─────────────────────────────
// 🔹 Utility: Seed Default Docs
// ─────────────────────────────
async function seedDefaultDocs(uid, role) {
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  const collections = [
    ["trustScores", { trustScore: 50, level: "Bronze", lastUpdated: now }],
    ["buyerTrust", { buyerScore: 50, verifiedPurchases: 0, lastUpdated: now }],
    ["akiliPoints", { points: 100, tier: "Trial", welcomeBonus: true, lastUpdated: now }],
    ["wallets", { balanceTZS: 0, currency: "TZS", ownerRole: role, createdAt: now }],
  ];

  for (const [col, data] of collections) {
    batch.set(db.collection(col).doc(uid), data, { merge: true });
  }

  batch.set(db.collection("analytics").doc(`userCreate_${uid}`), {
    uid,
    role,
    event: "user_created",
    timestamp: now,
  });

  await batch.commit();
  console.log(`🪄 Default docs + welcome reward created for ${uid}`);
}

// ─────────────────────────────
// 🔹 onUserCreate
// ─────────────────────────────
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const role = determineRole(user);
  const handle = (user.email?.split("@")[0] || `user_${uid.slice(0, 6)}`).toLowerCase();

  try {
    await auth.setCustomUserClaims(uid, { role });

    await db.collection("users").doc(uid).set({
      uid,
      email: user.email || "",
      displayName: user.displayName || "New User",
      handle,
      photoURL: user.photoURL || "",
      phone: user.phoneNumber || "",
      role,
      bio: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      wallet: { balance: 0, currency: "TZS", plan: { id: "trial", credits: 10 } },
      stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
    });

    await seedDefaultDocs(uid, role);

    await sendNotification(uid, "🎉 Welcome to AkiliPesa", "You’ve received a 100 Akili Points welcome bonus!");
    if (user.email) {
      await sendEmail(
        user.email,
        "Welcome to AkiliPesa 🌍",
        `Hi ${user.displayName || "there"}!\n\nYour ${role} account is ready.\nYou’ve been credited with 100 Akili Points — enjoy your trial experience!`
      );
    }

    console.log(`✅ onUserCreate completed for ${user.email || uid}`);
  } catch (err) {
    console.error("❌ onUserCreate error:", err);
  }
});

// ─────────────────────────────
// 🔹 onUserUpdate
// ─────────────────────────────
exports.onUserUpdate = functions.auth.user().onUpdate(async (change) => {
  const before = change.before;
  const after = change.after;
  if (before.email === after.email && before.displayName === after.displayName) return null;

  const uid = after.uid;
  const role = determineRole(after);
  try {
    await auth.setCustomUserClaims(uid, { role });
    await db.collection("users").doc(uid).update({
      role,
      email: after.email,
      displayName: after.displayName,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await sendNotification(uid, "🔄 Profile Updated", "Your AkiliPesa profile details were successfully updated.");
    console.log(`🔄 onUserUpdate done for ${after.email || uid}`);
  } catch (err) {
    console.error("❌ onUserUpdate error:", err);
  }
});

// ─────────────────────────────
// 🔹 onUserLogin
// ─────────────────────────────
exports.onUserLogin = functions.https.onCall(async (data, context) => {
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to call this function.");

  const uid = context.auth.uid;
  const userRef = db.collection("users").doc(uid);

  await userRef.update({
    lastLogin: FieldValue.serverTimestamp(),
  });

  const pointsRef = db.collection("akiliPoints").doc(uid);
  const pointsSnap = await pointsRef.get();
  if (!pointsSnap.exists || !pointsSnap.data().firstLoginReward) {
    await pointsRef.set(
      {
        points: admin.firestore.FieldValue.increment(100),
        firstLoginReward: true,
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await sendNotification(uid, "💎 First Login Reward", "You earned 100 bonus Akili Points for your first login!");
  }

  await sendNotification(uid, "👋 Login Successful", "Welcome back to AkiliPesa!");
  await db.collection("analytics").add({
    uid,
    event: "user_login",
    timestamp: FieldValue.serverTimestamp(),
  });

  console.log(`✅ Login event recorded for ${uid}`);
  return { success: true };
});

// ─────────────────────────────
// 🔹 onWalletUpdate
// ─────────────────────────────
exports.onWalletUpdate = functions.firestore
  .document("wallets/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    if (before.balanceTZS !== after.balanceTZS) {
      const delta = after.balanceTZS - before.balanceTZS;
      const direction = delta > 0 ? "added" : "deducted";
      const absDelta = Math.abs(delta);

      await db.collection("walletTransactions").add({
        userId,
        previousBalance: before.balanceTZS,
        newBalance: after.balanceTZS,
        delta,
        timestamp: FieldValue.serverTimestamp(),
      });

      await sendNotification(userId, "💰 Wallet Update", `Your wallet was ${direction} ${absDelta} TZS.`);
      const userDoc = await db.collection("users").doc(userId).get();
      const email = userDoc.exists ? userDoc.data().email : null;
      if (email) await sendEmail(email, "Wallet Update", `Your wallet has been ${direction} ${absDelta} TZS.`);

      await db.collection("analytics").add({
        userId,
        event: "wallet_update",
        amount: delta,
        timestamp: FieldValue.serverTimestamp(),
      });

      console.log(`💸 Wallet update logged for ${userId}`);
    }
  });

// ─────────────────────────────
// 🔹 onUserDelete
// ─────────────────────────────
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  const email = user.email || "unknown";
  try {
    const paths = [
      `users/${uid}`,
      `trustScores/${uid}`,
      `buyerTrust/${uid}`,
      `akiliPoints/${uid}`,
      `wallets/${uid}`,
    ];
    await Promise.all(paths.map((p) => db.doc(p).delete().catch(() => null)));

    await sendNotification("admin", "🗑️ User Deleted", `User ${email} (${uid}) has been removed.`);
    await db.collection("analytics").add({
      uid,
      event: "user_deleted",
      timestamp: FieldValue.serverTimestamp(),
    });

    console.log(`🧹 All records cleaned for deleted user ${email}`);
  } catch (err) {
    console.error("❌ onUserDelete error:", err);
  }
});