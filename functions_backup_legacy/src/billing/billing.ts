// functions/src/finance/billing.ts
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Helper to record a generic billing event.
 * Not exported as Cloud Function yet – used by other modules.
 */
export async function recordBillingEvent(data: {
  uid: string;
  amount: number;
  type: "call_debit" | "subscription" | "adjustment";
  meta?: any;
}) {
  const ref = db.collection("billingEvents").doc();
  await ref.set({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
