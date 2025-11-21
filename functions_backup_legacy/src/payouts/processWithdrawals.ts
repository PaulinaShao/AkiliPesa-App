// functions/src/payouts/processWithdrawals.ts

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const onWithdrawalApproved = onDocumentUpdated(
  "withdrawalRequests/{withdrawalId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status === after.status) return;
    if (after.status !== "approved") return;

    const { userId, amount, currency = "TZS" } = after;
    if (!userId || typeof amount !== "number") return;

    const txRef = db.collection("transactions").doc();
    const walletRef = db.collection("wallets").doc(userId);

    await db.runTransaction(async (trx) => {
      const walletSnap = await trx.get(walletRef);
      const walletData = walletSnap.data() || {
        balanceTZS: 0,
        escrow: 0,
        currency,
      };

      const newBalance = (walletData.balanceTZS || 0) - amount;

      trx.set(
        walletRef,
        {
          balanceTZS: newBalance,
          currency,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      trx.set(txRef, {
        id: txRef.id,
        uid: userId,
        amount: -Math.abs(amount),
        currency,
        type: "withdrawal",
        description: "Withdrawal payout",
        status: "completed",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      trx.update(event.data!.after.ref, {
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
);
