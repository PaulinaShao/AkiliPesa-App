import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * onFeedbackCreated
 * Trigger: feedback/{id} created
 * Adjusts trustScores and buyerTrust.
 */
export const onFeedbackCreated = onDocumentCreated(
  "feedback/{feedbackId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { targetUserId, fromUserId, rating = 5 } = data;
    if (!targetUserId || !fromUserId) return;

    const trustRef = db.collection("trustScores").doc(targetUserId);
    const buyerRef = db.collection("buyerTrust").doc(fromUserId);

    await db.runTransaction(async (trx) => {
      const trustSnap = await trx.get(trustRef);
      const trust = trustSnap.data() || {
        trustScore: 50,
        totalReviews: 0,
      };

      const newTotalReviews = (trust.totalReviews || 0) + 1;
      const newScore = Math.min(
        100,
        Math.max(
          0,
          (trust.trustScore || 50) + (rating - 3) * 2 // tweakable formula
        )
      );

      trx.set(
        trustRef,
        {
          trustScore: newScore,
          totalReviews: newTotalReviews,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const buyerSnap = await trx.get(buyerRef);
      const buyer = buyerSnap.data() || {
        buyerScore: 50,
        verifiedPurchases: 0,
      };

      trx.set(
        buyerRef,
        {
          buyerScore: Math.min(100, (buyer.buyerScore || 50) + 1),
          verifiedPurchases: (buyer.verifiedPurchases || 0) + 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  }
);
