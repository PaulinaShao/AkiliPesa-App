// functions/src/finance/transactions.ts
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Small helper to create a transaction document.
 * Used by other finance functions if needed.
 */
export async function createTransactionDoc(data: {
  uid: string;
  amount: number;
  type: string;
  description?: string;
  status?: string;
  currency?: string;
  participants?: string[];
  extra?: any;
}) {
  const ref = db.collection("transactions").doc();
  await ref.set({
    currency: "TZS",
    status: "completed",
    participants: data.participants || [data.uid],
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
