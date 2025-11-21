"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWalletTransfer = void 0;
// functions/src/finance/sendWalletTransfer.ts
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
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
exports.sendWalletTransfer = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    const auth = request.auth;
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    const fromUid = auth.uid;
    const { toUid, amount, description } = request.data || {};
    if (!toUid || typeof toUid !== "string") {
        throw new https_1.HttpsError("invalid-argument", "'toUid' is required.");
    }
    if (toUid === fromUid) {
        throw new https_1.HttpsError("invalid-argument", "You cannot transfer to your own wallet.");
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new https_1.HttpsError("invalid-argument", "'amount' must be a positive number.");
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
            ? senderSnap.data()
            : { balanceTZS: 0 };
        const receiverWallet = receiverSnap.exists
            ? receiverSnap.data()
            : { balanceTZS: 0 };
        const platformWallet = platformSnap.exists
            ? platformSnap.data()
            : { balanceTZS: 0 };
        const senderBalance = Number(senderWallet.balanceTZS || 0);
        const receiverBalance = Number(receiverWallet.balanceTZS || 0);
        const platformBalance = Number(platformWallet.balanceTZS || 0);
        if (senderBalance < totalDebit) {
            throw new https_1.HttpsError("failed-precondition", "INSUFFICIENT_FUNDS: not enough balance.");
        }
        const newSenderBalance = senderBalance - totalDebit;
        const newReceiverBalance = receiverBalance + numericAmount;
        const newPlatformBalance = platformBalance + fee;
        const now = admin.firestore.FieldValue.serverTimestamp();
        const participants = [fromUid, toUid, PLATFORM_WALLET_ID];
        // Update wallets
        tx.set(senderRef, { balanceTZS: newSenderBalance, currency: "TZS", updatedAt: now }, { merge: true });
        tx.set(receiverRef, { balanceTZS: newReceiverBalance, currency: "TZS", updatedAt: now }, { merge: true });
        tx.set(platformRef, {
            balanceTZS: newPlatformBalance,
            currency: "TZS",
            ownerRole: "platform",
            updatedAt: now,
        }, { merge: true });
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
});
//# sourceMappingURL=sendWalletTransfer.js.map