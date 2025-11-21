/**
 * Initialize all required Firestore collections for
 * REAL-TIME BILLING + SUBSCRIPTIONS + CALL COSTING
 *
 * Run AFTER serviceAccountKey.json is installed:
 *    npx ts-node scripts/initRealtimeBilling.ts
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

const collectionsToCreate = [
  "activeCalls",
  "realtimeBilling",
  "usageLogs",
  "agentEarnings",
  "revenueReports",
  "subscriptionUsage",
  "callCosts",
  "transactions",
  "wallets",
  "subscriptions",
  "escrow",
  "orders",
];

async function init() {
  console.log("🚀 Initializing AkiliPesa Real-Time Billing Structure...");

  for (const col of collectionsToCreate) {
    const ref = db.collection(col).doc("_init");
    await ref.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      note: "collection_initialized",
    });
    console.log(`✔️ Created/Verified Collection → ${col}`);
  }

  console.log("🔥 Real-time billing structure initialized.");
  process.exit(0);
}

init().catch((err) => {
  console.error("❌ initRealtimeBilling failed:", err);
  process.exit(1);
});
