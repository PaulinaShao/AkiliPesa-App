/**
 * AUTO-FIX FIRESTORE STRUCTURE
 * Ensures ALL users + billing collections have complete structure.
 *
 * Run:
 *    npx ts-node scripts/verifyStructure.ts
 */

import admin from "firebase-admin";
import path from "path";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require(path.join(__dirname, "./serviceAccountKey.json"))
    ),
  });
}

const db = admin.firestore();

async function ensureDoc(path: string, defaultData: any) {
  const ref = db.doc(path);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      ...defaultData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`🆕 Created missing doc: ${path}`);
  } else {
    await ref.set(
      {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...defaultData,
      },
      { merge: true }
    );
    console.log(`✔️ Updated structure: ${path}`);
  }
}

async function verify() {
  console.log("🔍 Verifying Firestore Structure...");

  const usersSnap = await db.collection("users").get();
  console.log(`📌 Found ${usersSnap.size} users`);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;

    console.log(`\n🔧 Fixing user ${uid}...`);

    await ensureDoc(`wallets/${uid}`, {
      balanceTZS: 0,
      escrow: 0,
      plan: {
        type: "trial",
        credits: 10,
        expiry: null,
      },
    });

    await ensureDoc(`subscriptions/${uid}`, {
      active: true,
      planId: "trial",
      creditsRemaining: 10,
      expiresAt: null,
    });

    await ensureDoc(`akiliPoints/${uid}`, { points: 0, tier: "Free" });

    await ensureDoc(`trustScores/${uid}`, {
      trustScore: 50,
      level: "Bronze",
    });

    await ensureDoc(`buyerTrust/${uid}`, {
      buyerScore: 50,
      verifiedPurchases: 0,
    });

    await ensureDoc(`agentEarnings/${uid}`, {
      totalEarned: 0,
      commissionEarned: 0,
    });
  }

  console.log("\n🎉 Firestore structure verified and corrected.");
  process.exit(0);
}

verify().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
