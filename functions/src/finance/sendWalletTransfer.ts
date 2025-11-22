import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase.js";

/**
 * Wallet transfer with a 3% platform fee.
 * Path: /wallets/{uid}
 */
export const sendWalletTransfer = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");

    const fromUid = auth.uid;
    const { toUid, amount, description } = request.data || {};

    if (!toUid || typeof toUid !== "string")
      throw new HttpsError("invalid-argument", "'toUid' is required.");

    if (toUid === fromUid)
      throw new HttpsError(
        "invalid-argument",
        "Cannot transfer to your own wallet."
      );

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0)
      throw new HttpsError("invalid-argument", "'amount' must be positive.");

    const PLATFORM_WALLET_ID = "platform";
    const feeRate = 0.03;
    const fee = Math.round(numericAmount * feeRate);
    const totalDebit = numericAmount + fee;

    const senderRef = db.collection("wallets").doc(fromUid);
    const receiverRef = db.collection("wallets").doc(toUid);
    const platformRef = db.collection("wallets").doc(PLATFORM_WALLET_ID);
    const txCol = db.collection("transactions");

    const result = await db.runTransaction(async (tx: admin.firestore.Transaction) => {
      const [senderSnap, receiverSnap, platformSnap] = await Promise.all([
        tx.get(senderRef),
        tx.get(receiverRef),
        tx.get(platformRef),
      ]);

      const senderBalance = senderSnap.data()?.balanceTZS || 0;
      const receiverBalance = receiverSnap.data()?.balanceTZS || 0;
      const platformBalance = platformSnap.data()?.balanceTZS || 0;

      if (senderBalance < totalDebit)
        throw new HttpsError("failed-precondition", "INSUFFICIENT_FUNDS");

      const now = admin.firestore.FieldValue.serverTimestamp();

      // update balances
      tx.set(
        senderRef,
        { balanceTZS: senderBalance - totalDebit, updatedAt: now },
        { merge: true }
      );

      tx.set(
        receiverRef,
        { balanceTZS: receiverBalance + numericAmount, updatedAt: now },
        { merge: true }
      );

      tx.set(
        platformRef,
        { balanceTZS: platformBalance + fee, updatedAt: now },
        { merge: true }
      );

      // log transactions
      tx.set(txCol.doc(), {
        uid: fromUid,
        amount: -numericAmount,
        type: "transfer_debit",
        description,
        counterpartyId: toUid,
        createdAt: now,
      });

      tx.set(txCol.doc(), {
        uid: toUid,
        amount: numericAmount,
        type: "transfer_credit",
        description,
        counterpartyId: fromUid,
        createdAt: now,
      });

      tx.set(txCol.doc(), {
        uid: fromUid,
        amount: -fee,
        type: "fee_debit",
        description: "Transfer fee",
        createdAt: now,
      });

      tx.set(txCol.doc(), {
        uid: PLATFORM_WALLET_ID,
        amount: fee,
        type: "fee_credit",
        createdAt: now,
      });

      return { newBalance: senderBalance - totalDebit };
    });

    return { ok: true, ...result };
  }
);
