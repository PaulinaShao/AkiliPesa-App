import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Trigger runs when a transaction doc is created
export const enforceTransactionUid = functions.firestore
  .document("transactions/{txId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const txRef = snap.ref;

    // If uid already present, no action needed
    if (data?.uid) {
      console.log(`✅ Transaction ${context.params.txId} already has uid: ${data.uid}`);
      return null;
    }

    // Try to infer from auth context or subfields
    const inferredUid =
      data?.userId ||
      data?.buyerId ||
      data?.sellerId ||
      context.auth?.uid ||
      null;

    if (!inferredUid) {
      console.warn(`⚠️ Transaction ${context.params.txId} missing uid and no fallback`);
      return null;
    }

    // Patch document safely
    await txRef.set(
      {
        uid: inferredUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`🛠️ UID auto-applied to transaction ${context.params.txId}: ${inferredUid}`);
    return null;
  });