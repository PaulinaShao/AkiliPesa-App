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
exports.verifyAndReleaseEscrow = exports.createEscrowOnOrder = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * createEscrowOnOrder
 * Trigger: orders/{orderId} created with paymentStatus 'paid'
 * Move funds into escrow.
 */
exports.createEscrowOnOrder = (0, firestore_1.onDocumentCreated)("orders/{orderId}", async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    if (data.paymentStatus !== "paid")
        return;
    const { buyerId, sellerId, totalAmount, currency = "TZS" } = data;
    if (!buyerId || !sellerId || typeof totalAmount !== "number")
        return;
    const escrowRef = db.collection("escrow").doc(event.params.orderId);
    await escrowRef.set({
        orderId: event.params.orderId,
        buyerId,
        sellerId,
        amount: totalAmount,
        currency,
        status: "held",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
/**
 * verifyAndReleaseEscrow
 * Trigger: orders/{orderId} updated; when status becomes 'completed', release escrow.
 */
exports.verifyAndReleaseEscrow = (0, firestore_1.onDocumentUpdated)("orders/{orderId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== "completed")
        return;
    const { orderId } = event.params;
    const escrowRef = db.collection("escrow").doc(orderId);
    const escrowSnap = await escrowRef.get();
    if (!escrowSnap.exists)
        return;
    const escrow = escrowSnap.data();
    if (escrow.status === "released")
        return;
    const sellerWalletRef = db.collection("wallets").doc(escrow.sellerId);
    const txRef = db.collection("transactions").doc();
    await db.runTransaction(async (trx) => {
        const walletSnap = await trx.get(sellerWalletRef);
        const walletData = walletSnap.data() || {
            balanceTZS: 0,
            currency: escrow.currency,
        };
        const newBalance = (walletData.balanceTZS || 0) + escrow.amount;
        trx.set(sellerWalletRef, {
            balanceTZS: newBalance,
            currency: escrow.currency,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        trx.update(escrowRef, {
            status: "released",
            releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        trx.set(txRef, {
            id: txRef.id,
            uid: escrow.sellerId,
            amount: escrow.amount,
            currency: escrow.currency,
            type: "sale_payout",
            description: "Escrow Released",
            status: "completed",
            participants: [escrow.sellerId, escrow.buyerId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
});
//# sourceMappingURL=escrow.js.map