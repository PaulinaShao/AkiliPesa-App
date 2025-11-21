import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

async function addPoints(uid: string, delta: number, reason: string) {
  if (!uid || !delta) return;

  const pointsRef = db.collection("akiliPoints").doc(uid);
  await db.runTransaction(async (trx) => {
    const snap = await trx.get(pointsRef);
    const data = snap.data() || { points: 0, tier: "Free" };
    const newPoints = (data.points || 0) + delta;
    trx.set(
      pointsRef,
      {
        points: newPoints,
        lastReason: reason,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const historyRef = db.collection("rewardHistory").doc();
    trx.set(historyRef, {
      id: historyRef.id,
      userId: uid,
      delta,
      reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

/**
 * onProductSaleReward
 * Trigger: sales/{saleId} created
 */
export const onProductSaleReward = onDocumentCreated(
  "sales/{saleId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const sellerId = data.sellerId as string | undefined;
    if (!sellerId) return;
    await addPoints(sellerId, 10, "Product sale");
  }
);

/**
 * onReferralReward
 * Trigger: referrals/{referralId} created
 */
export const onReferralReward = onDocumentCreated(
  "referrals/{referralId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const referrerId = data.referrerId as string | undefined;
    if (!referrerId) return;
    await addPoints(referrerId, 5, "Referral signup");
  }
);

/**
 * onAIInteractionReward
 * Trigger: aiSessions/{sessionId} updated
 * When session completes, give small reward.
 */
export const onAIInteractionReward = onDocumentUpdated(
  "aiSessions/{sessionId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.isActive && after.isActive === false) {
      const uid = after.userId as string | undefined;
      if (!uid) return;
      await addPoints(uid, 1, "AI session completed");
    }
  }
);
