import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * redeemReward
 * Callable to convert points into a reward.
 */
export const redeemReward = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { cost = 10, rewardType = "voucher" } = request.data as {
    cost?: number;
    rewardType?: string;
  };

  if (cost <= 0) {
    throw new HttpsError("invalid-argument", "Invalid cost.");
  }

  const pointsRef = db.collection("akiliPoints").doc(uid);
  const historyRef = db.collection("rewardHistory").doc();

  await db.runTransaction(async (trx) => {
    const snap = await trx.get(pointsRef);
    const data = snap.data() || { points: 0 };
    if ((data.points || 0) < cost) {
      throw new HttpsError("failed-precondition", "Not enough points.");
    }

    trx.set(
      pointsRef,
      {
        points: (data.points || 0) - cost,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    trx.set(historyRef, {
      id: historyRef.id,
      userId: uid,
      delta: -cost,
      rewardType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});
