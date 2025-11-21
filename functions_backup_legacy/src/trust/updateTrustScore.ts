// functions/src/trust/updateTrustScore.ts
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const updateTrustScore = onCall(async (req) => {
  const { uid, amount } = req.data;

  return admin.firestore().collection("trustScores").doc(uid).set({
    trustScore: admin.firestore.FieldValue.increment(amount),
    updatedAt: new Date(),
  }, { merge: true });
});
