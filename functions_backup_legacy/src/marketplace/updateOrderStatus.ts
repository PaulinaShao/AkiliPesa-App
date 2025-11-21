// functions/src/marketplace/updateOrderStatus.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Simple callable to update an order status from frontend / admin.
 * Example: "pending" → "paid" → "delivered".
 */
export const updateOrderStatus = onCall(
  { region: "us-central1" },
  async (req) => {
    const auth = req.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const { orderId, status } = req.data || {};
    if (!orderId || !status) {
      throw new HttpsError(
        "invalid-argument",
        "orderId and status are required."
      );
    }

    await db.doc(`orders/${orderId}`).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true };
  }
);
