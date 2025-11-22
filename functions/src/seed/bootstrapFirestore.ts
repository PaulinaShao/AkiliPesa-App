import { db, admin } from "../firebase/index.js";

export async function bootstrapFirestore() {
  console.log("🚀 Bootstrapping Firestore...");

  const batches = [];

  function batchSet(path: string, data: any) {
    const batch = db.batch();
    const ref = db.doc(path);
    batch.set(ref, data, { merge: true });
    batches.push(batch.commit());
  }

  // ---------------------------
  // VENDOR CONFIG
  // ---------------------------
  batchSet("system/vendorConfig", {
    openai: { enabled: true, cost: 1 },
    runpod: { enabled: true, cost: 2 },
    whisper: { enabled: true, cost: 1 },
    pika: { enabled: true, cost: 2 },
    luma: { enabled: true, cost: 3 },
    kaiber: { enabled: true, cost: 3 },
    deepmotion: { enabled: true, cost: 3 },
    udio: { enabled: true, cost: 2 },
    suno: { enabled: true, cost: 2 },
    synthesia: { enabled: true, cost: 4 }
  });

  // ---------------------------
  // AI LOGS ROOT COLLECTION
  // ---------------------------
  batchSet("system/aiLogs", { created: admin.firestore.FieldValue.serverTimestamp() });

  // ---------------------------
  // CALL SESSIONS
  // ---------------------------
  batchSet("system/callSessions", { created: admin.firestore.FieldValue.serverTimestamp() });

  // ---------------------------
  // SOCIAL FEED
  // ---------------------------
  batchSet("system/socialFeed", { created: admin.firestore.FieldValue.serverTimestamp() });

  // ---------------------------
  // MARKETPLACE
  // ---------------------------
  batchSet("system/marketplace", { created: admin.firestore.FieldValue.serverTimestamp() });

  // ---------------------------
  // REWARDS
  // ---------------------------
  batchSet("system/rewards", {
    starRewardRate: 0.1,
    agentBonusRate: 0.2,
    minWithdraw: 1000
  });

  // ---------------------------
  // TRUST SCORES
  // ---------------------------
  batchSet("system/trustScores", { created: admin.firestore.FieldValue.serverTimestamp() });

  // ---------------------------
  // SETTINGS
  // ---------------------------
  batchSet("system/settings", {
    version: "1.0.0",
    maintenanceMode: false
  });

  await Promise.all(batches);

  console.log("🎉 Firestore bootstrap finished!");
  return { success: true };
}
