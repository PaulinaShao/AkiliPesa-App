// functions/src/finance/commissions.ts
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Helper: credit commission to an agent.
 */
export async function creditCommission(params: {
  agentUid: string;
  amount: number;
  sourceOrderId?: string;
}) {
  const { agentUid, amount, sourceOrderId } = params;

  const walletRef = db.doc(`wallets/${agentUid}`);
  const txRef = db.collection("transactions").doc();

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const walletSnap = await tx.get(walletRef);
    const wallet = walletSnap.exists ? (walletSnap.data() as any) : {};

    const balance = Number(wallet.balanceTZS || 0);
    const newBalance = balance + amount;

    tx.set(
      walletRef,
      { balanceTZS: newBalance, currency: "TZS", updatedAt: now },
      { merge: true }
    );

    tx.set(txRef, {
      uid: agentUid,
      amount,
      currency: "TZS",
      type: "commission_credit",
      description: "Commission from sale",
      status: "completed",
      sourceOrderId,
      participants: [agentUid],
      createdAt: now,
    });
  });
}
