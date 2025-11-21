// functions/src/finance/subscriptions.ts
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const db = admin.firestore();

/**
 * Simple placeholder for subscription purchase.
 * Later you’ll integrate Flutterwave and real plans here.
 */
export const purchaseSubscriptionPlan = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { planId, credits } = request.data || {};
    if (!planId) {
      throw new HttpsError("invalid-argument", "planId is required.");
    }

    const uid = auth.uid;
    const subRef = db.doc(`subscriptions/${uid}`);

    await subRef.set(
      {
        uid,
        planId,
        credits: Number(credits) || 0,
        status: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true };
  }
);
