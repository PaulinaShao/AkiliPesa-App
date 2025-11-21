import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * createEscrowOnOrder
 * Trigger: orders/{orderId} created with paymentStatus 'paid'
 * Move funds into escrow.
 */
export const createEscrowOnOrder = onDocumentCreated(
  "orders/{orderId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    if (data.paymentStatus !== "paid") return;

    const { buyerId, sellerId, totalAmount, currency = "TZS" } = data;
    if (!buyerId || !sellerId || typeof totalAmount !== "number") return;

    const escrowRef = db.collection("escrow").doc(event.params.orderId);
    await escrowRef.set({
      orderId: event.params.orderId,
      buyerId,
      sellerId,
      amount: totalAmount,
      currency,
      status: "held",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

/**
 * verifyAndReleaseEscrow
 * Trigger: orders/{orderId} updated; when status becomes 'completed', release escrow.
 */
export const verifyAndReleaseEscrow = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status === after.status) return;
    if (after.status !== "completed") return;

    const { orderId } = event.params;
    const escrowRef = db.collection("escrow").doc(orderId);
    const escrowSnap = await escrowRef.get();
    if (!escrowSnap.exists) return;
    const escrow = escrowSnap.data()!;

    if (escrow.status === "released") return;

    const sellerWalletRef = db.collection("wallets").doc(escrow.sellerId);
    const txRef = db.collection("transactions").doc();

    await db.runTransaction(async (trx) => {
      const walletSnap = await trx.get(sellerWalletRef);
      const walletData = walletSnap.data() || {
        balanceTZS: 0,
        currency: escrow.currency,
      };

      const newBalance = (walletData.balanceTZS || 0) + escrow.amount;

      trx.set(
        sellerWalletRef,
        {
          balanceTZS: newBalance,
          currency: escrow.currency,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      trx.update(escrowRef, {
        status: "released",
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      trx.set(txRef, {
        id: txRef.id,
        uid: escrow.sellerId,
        amount: escrow.amount,
        currency: escrow.currency,
        type: "sale_payout",
        description: "Escrow Released",
        status: "completed",
        participants: [escrow.sellerId, escrow.buyerId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
);
