/**
 * Assign roles & create default user documents
 */

import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.applicationDefault() });

const db = admin.firestore();

function determineRole(user) {
  const email = (user.email || "").toLowerCase();
  if (email.includes("paulinajshao") || email.includes("admin@akilipesa")) return "admin";
  if (email.includes("agent")) return "agent";
  return "customer";
}

async function ensureUserProfile(user, role) {
  const userRef = db.collection("users").doc(user.uid);
  if (!(await userRef.get()).exists) {
    await userRef.set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "User",
      handle:
        (user.email?.split("@")[0] || `user_${user.uid.slice(0, 6)}`) +
        "_" +
        Math.floor(Math.random() * 99),
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`🆕 /users/${user.uid} created`);
  }
}

async function ensureFinancialDocs(uid, role) {
  const docs = [
    {
      path: `wallets/${uid}`,
      data: {
        balanceTZS: 0,
        credits: { ai: 0, calls: 0 },
        escrow: 0,
        currency: "TZS",
        ownerRole: role,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    {
      path: `subscriptions/${uid}`,
      data: {
        planId: "free",
        callCredits: 0,
        aiCredits: 0,
        renewDate: null,
        active: false
      }
    },
    { path: `ai_limits/${uid}`, data: { dailyCalls: 0, dailyAI: 0 } }
  ];

  for (const d of docs) {
    const ref = db.doc(d.path);
    if (!(await ref.get()).exists) {
      await ref.set(d.data);
      console.log(`🪄 Created ${d.path}`);
    }
  }
}

async function run() {
  console.log("🚀 Seeding...");

  let nextPageToken;
  do {
    const res = await admin.auth().listUsers(1000, nextPageToken);
    for (const user of res.users) {
      const role = determineRole(user);
      await admin.auth().setCustomUserClaims(user.uid, { role });

      await ensureUserProfile(user, role);
      await ensureFinancialDocs(user.uid, role);
    }
    nextPageToken = res.pageToken;
  } while (nextPageToken);

  console.log("🎯 Done");
  process.exit(0);
}

run();
