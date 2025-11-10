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
exports.walletManager = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Firestore trigger to normalize wallet data and guard against inconsistencies.
 */
exports.walletManager = functions.firestore
    .document('wallet/{uid}')
    .onWrite(async (change, context) => {
    const afterData = change.after.data();
    if (!change.after.exists || !afterData) {
        console.log(`Wallet for ${context.params.uid} deleted. No action taken.`);
        return null;
    }
    // Guard against negative balances
    if (afterData.balance < 0) {
        console.warn(`Negative balance detected for ${context.params.uid}. Correcting.`);
        // Create a corrective transaction to bring the balance back to zero.
        const correctionAmount = -afterData.balance;
        const correctiveTx = {
            amount: correctionAmount,
            type: 'correction',
            description: 'System correction for negative balance.',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        // Use a transaction to ensure atomicity
        const walletRef = db.collection('wallet').doc(context.params.uid);
        return db.runTransaction(async (transaction) => {
            transaction.update(walletRef, {
                balance: 0,
                transactions: admin.firestore.FieldValue.arrayUnion(correctiveTx),
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            });
        });
    }
    // TODO: Could add logic here to sync a summary to the main users/{uid} doc
    // for faster client-side reads, e.g., on an `onUpdate` event.
    return null;
});
//# sourceMappingURL=walletManager.js.map