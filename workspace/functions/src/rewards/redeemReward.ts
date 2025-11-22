import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase.js";

export const redeemReward = onCall(
  { region: "us-central1" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
      throw new HttpsError("unauthenticated", "Login required.");

    const { rewardId, costPoints } = request.data || {};
    if (!rewardId || !costPoints)
      throw new HttpsError("invalid-argument", "Missing args.");

    const userRef = db.collection("users").doc(uid);

    await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      const snap = await tx.get(userRef);
      const current = snap.data()?.points || 0;

      if (current < costPoints)
        throw new HttpsError("failed-precondition", "Not enough points.");

      tx.update(userRef, {
        points: current - costPoints,
        lastRedeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(db.collection("rewardRedemptions").doc(), {
        uid,
        rewardId,
        costPoints,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { ok: true };
  }
);
