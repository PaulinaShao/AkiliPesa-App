// functions/src/finance/walletManager.ts
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Utility to ensure a wallet document exists for given uid.
 */
export async function ensureWallet(uid: string) {
  const ref = db.doc(`wallets/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      uid,
      balanceTZS: 0,
      escrow: 0,
      currency: "TZS",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  return ref;
}
