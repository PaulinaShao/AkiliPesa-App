"use strict";
// functions/src/payouts/processWithdrawals.ts
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
exports.onWithdrawalApproved = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.onWithdrawalApproved = (0, firestore_1.onDocumentUpdated)("withdrawalRequests/{withdrawalId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== "approved")
        return;
    const { userId, amount, currency = "TZS" } = after;
    if (!userId || typeof amount !== "number")
        return;
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
        trx.set(walletRef, {
            balanceTZS: newBalance,
            currency,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
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
        trx.update(event.data.after.ref, {
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
});
//# sourceMappingURL=processWithdrawals.js.map