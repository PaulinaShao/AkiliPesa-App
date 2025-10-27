/**
 * 🔄  AkiliPesa Role + Data + Profile Seeder
 * 1️⃣ Assigns roles (admin | agent | customer)
 * 2️⃣ Creates default Firestore docs:
 *     users, trustScores, buyerTrust, akiliPoints, wallets
 */

import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

// ─────────────────────────────
// Determine user role
// ─────────────────────────────
function determineRole(user) {
  const email = (user.email || "").toLowerCase();
  const name  = (user.displayName || "").toLowerCase();
  if (email.includes("paulinajshao") || email.includes("admin@akilipesa")) return "admin";
  if (email.includes("agent") || name.includes("agent")) return "agent";
  return "customer";
}

// ─────────────────────────────
// Create default user profile
// ─────────────────────────────
async function ensureUserProfile(user, role) {
  const userRef = db.collection("users").doc(user.uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    const handle = (user.email?.split("@")[0] || `user_${user.uid.slice(0,6)}`).toLowerCase();
    await userRef.set({
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || "New User",
      handle,
      photoURL: user.photoURL || "",
      role,
      bio: "",
      phone: user.phoneNumber || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      wallet: {
        balance: 0,
        currency: "TZS",
        plan: { id: "trial", credits: 10 },
      },
      stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
    });
    console.log(`🪄 Created /users/${user.uid} profile (${role})`);
  } else {
    console.log(`✔️  Profile /users/${user.uid} already exists`);
  }
}

// ─────────────────────────────
// Create supporting documents
// ─────────────────────────────
async function ensureDefaultDocs(uid, role) {
  const defaults = [
    { path: `trustScores/${uid}`, data: { trustScore: 50, level: "Bronze", lastUpdated: admin.firestore.FieldValue.serverTimestamp() } },
    { path: `buyerTrust/${uid}`,  data: { buyerScore: 50, verifiedPurchases: 0, lastUpdated: admin.firestore.FieldValue.serverTimestamp() } },
    { path: `akiliPoints/${uid}`, data: { points: 0, tier: "Free", lastUpdated: admin.firestore.FieldValue.serverTimestamp() } },
    { path: `wallets/${uid}`,     data: { balanceTZS: 0, currency: "TZS", ownerRole: role, createdAt: admin.firestore.FieldValue.serverTimestamp() } },
  ];

  for (const item of defaults) {
    const ref = db.doc(item.path);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set(item.data);
      console.log(`🪄 Created ${item.path}`);
    } else {
      console.log(`✔️  ${item.path} already exists`);
    }
  }
}

// ─────────────────────────────
// Main Seeder
// ─────────────────────────────
async function assignRolesAndSeedProfiles() {
  console.log("🚀 Fetching Firebase Auth users...");
  let nextPageToken, count = 0;

  do {
    const res = await admin.auth().listUsers(1000, nextPageToken);
    for (const user of res.users) {
      const role = determineRole(user);
      const claims = user.customClaims || {};

      // Assign role if missing or mismatched
      if (claims.role !== role) {
        await admin.auth().setCustomUserClaims(user.uid, { role });
        console.log(`✅ Assigned role "${role}" to ${user.email || user.uid}`);
      } else {
        console.log(`⏩ ${user.email || user.uid} already has role ${role}`);
      }

      // Create user profile and base docs
      await ensureUserProfile(user, role);
      await ensureDefaultDocs(user.uid, role);

      count++;
    }
    nextPageToken = res.pageToken;
  } while (nextPageToken);

  console.log(`🎯 Seeder completed for ${count} users!`);
  process.exit(0);
}

// ─────────────────────────────
// Run
// ─────────────────────────────
assignRolesAndSeedProfiles().catch((e) => {
  console.error("❌ Seeder failed:", e);
  process.exit(1);
});
