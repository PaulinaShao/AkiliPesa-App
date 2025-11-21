import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * onOrderStatusChange
 * Trigger: orders/{orderId} updated
 * Logs status transitions into revenueReports collection.
 */
export const onOrderStatusChange = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status === after.status) return;

    const { orderId } = event.params;
    const { buyerId, sellerId, totalAmount = 0, currency = "TZS" } = after;

    const logRef = db.collection("revenueReports").doc();
    await logRef.set({
      id: logRef.id,
      orderId,
      buyerId,
      sellerId,
      amount: totalAmount,
      currency,
      fromStatus: before.status,
      toStatus: after.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);
