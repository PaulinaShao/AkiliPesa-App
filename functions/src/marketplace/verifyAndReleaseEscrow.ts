
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase";

export const verifyAndReleaseEscrow = onCall(
  { region: "us-central1" },
  async (request) => {
    const { orderId } = request.data || {};
    if (!orderId) throw new HttpsError("invalid-argument", "orderId required.");

    const escrowRef = db
      .collection("orders")
      .doc(orderId)
      .collection("escrow")
      .doc("escrow");

    const escrowSnap = await escrowRef.get();
    if (!escrowSnap.exists)
      throw new HttpsError("not-found", "Escrow not found.");

    const escrow = escrowSnap.data();
    if (escrow.status !== "held")
      throw new HttpsError("failed-precondition", "Escrow already released.");

    const sellerRef = db.collection("wallets").doc(escrow.sellerId);
    const txRef = db.collection("transactions").doc();

    const now = admin.firestore.FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
      const sellerSnap = await tx.get(sellerRef);
      const sellerBalance = sellerSnap.data()?.balanceTZS || 0;

      tx.update(sellerRef, {
        balanceTZS: sellerBalance + escrow.amount,
        updatedAt: now,
      });

      tx.update(escrowRef, {
        status: "released",
        releasedAt: now,
      });

      tx.set(txRef, {
        uid: escrow.sellerId,
        amount: escrow.amount,
        type: "escrow_release",
        orderId,
        createdAt: now,
      });
    });

    return { ok: true };
  }
);
