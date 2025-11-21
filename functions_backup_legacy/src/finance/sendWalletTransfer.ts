// functions/src/finance/sendWalletTransfer.ts
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const db = admin.firestore();

/**
 * Callable: sendWalletTransfer
 *
 * - Auth required (sender)
 * - 3% platform fee on sender
 * - Creates 4 transactions:
 *   1) sender transfer_debit (-amount)
 *   2) receiver transfer_credit (+amount)
 *   3) sender fee_debit (-fee)
 *   4) platform fee_credit (+fee)
 * - Updates wallets in a Firestore transaction
 */
export const sendWalletTransfer = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const fromUid = auth.uid;
    const { toUid, amount, description } = request.data || {};

    if (!toUid || typeof toUid !== "string") {
      throw new HttpsError("invalid-argument", "'toUid' is required.");
    }
    if (toUid === fromUid) {
      throw new HttpsError(
        "invalid-argument",
        "You cannot transfer to your own wallet."
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new HttpsError(
        "invalid-argument",
        "'amount' must be a positive number."
      );
    }

    const feeRate = 0.03;
    const fee = Math.round(numericAmount * feeRate); // TZS, integer
    const totalDebit = numericAmount + fee;

    // Platform “master” wallet
    const PLATFORM_WALLET_ID = "platform";

    const senderRef = db.doc(`wallets/${fromUid}`);
    const receiverRef = db.doc(`wallets/${toUid}`);
    const platformRef = db.doc(`wallets/${PLATFORM_WALLET_ID}`);

    const txCol = db.collection("transactions");

    const result = await db.runTransaction(async (tx) => {
      const [senderSnap, receiverSnap, platformSnap] = await Promise.all([
        tx.get(senderRef),
        tx.get(receiverRef),
        tx.get(platformRef),
      ]);

      const senderWallet = senderSnap.exists
        ? (senderSnap.data() as any)
        : { balanceTZS: 0 };
      const receiverWallet = receiverSnap.exists
        ? (receiverSnap.data() as any)
        : { balanceTZS: 0 };
      const platformWallet = platformSnap.exists
        ? (platformSnap.data() as any)
        : { balanceTZS: 0 };

      const senderBalance = Number(senderWallet.balanceTZS || 0);
      const receiverBalance = Number(receiverWallet.balanceTZS || 0);
      const platformBalance = Number(platformWallet.balanceTZS || 0);

      if (senderBalance < totalDebit) {
        throw new HttpsError(
          "failed-precondition",
          "INSUFFICIENT_FUNDS: not enough balance."
        );
      }

      const newSenderBalance = senderBalance - totalDebit;
      const newReceiverBalance = receiverBalance + numericAmount;
      const newPlatformBalance = platformBalance + fee;

      const now = admin.firestore.FieldValue.serverTimestamp();
      const participants = [fromUid, toUid, PLATFORM_WALLET_ID];

      // Update wallets
      tx.set(
        senderRef,
        { balanceTZS: newSenderBalance, currency: "TZS", updatedAt: now },
        { merge: true }
      );
      tx.set(
        receiverRef,
        { balanceTZS: newReceiverBalance, currency: "TZS", updatedAt: now },
        { merge: true }
      );
      tx.set(
        platformRef,
        {
          balanceTZS: newPlatformBalance,
          currency: "TZS",
          ownerRole: "platform",
          updatedAt: now,
        },
        { merge: true }
      );

      // 1) Sender transfer debit
      tx.set(txCol.doc(), {
        uid: fromUid,
        amount: -numericAmount,
        currency: "TZS",
        type: "transfer_debit",
        description: description || "Wallet transfer",
        status: "completed",
        counterpartyId: toUid,
        participants,
        createdAt: now,
      });

      // 2) Receiver transfer credit
      tx.set(txCol.doc(), {
        uid: toUid,
        amount: numericAmount,
        currency: "TZS",
        type: "transfer_credit",
        description: description || "Wallet transfer",
        status: "completed",
        counterpartyId: fromUid,
        participants,
        createdAt: now,
      });

      // 3) Sender fee debit
      tx.set(txCol.doc(), {
        uid: fromUid,
        amount: -fee,
        currency: "TZS",
        type: "fee_debit",
        description: "Transfer fee (3%)",
        status: "completed",
        participants,
        createdAt: now,
      });

      // 4) Platform fee credit
      tx.set(txCol.doc(), {
        uid: PLATFORM_WALLET_ID,
        amount: fee,
        currency: "TZS",
        type: "fee_credit",
        description: `Transfer fee from ${fromUid}`,
        status: "completed",
        participants,
        createdAt: now,
      });

      return { newSenderBalance, newReceiverBalance, fee, totalDebit };
    });

    return { ok: true, ...result };
  }
);
