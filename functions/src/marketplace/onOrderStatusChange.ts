import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db, admin } from "../firebase.js";

/**
 * Firestore Trigger – when order status changes
 */
export const onOrderStatusChange = onDocumentUpdated(
  {
    region: "us-central1",
    document: "orders/{orderId}",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    if (before.status !== "completed" && after.status === "completed") {
      // release escrow
      const orderId = event.params.orderId;

      const escrowFn = db.collection("_fnQueue").doc();
      await escrowFn.set({
        fn: "verifyAndReleaseEscrow",
        orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);
