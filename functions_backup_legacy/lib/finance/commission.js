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
exports.creditCommission = creditCommission;
// functions/src/finance/commissions.ts
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Helper: credit commission to an agent.
 */
async function creditCommission(params) {
    const { agentUid, amount, sourceOrderId } = params;
    const walletRef = db.doc(`wallets/${agentUid}`);
    const txRef = db.collection("transactions").doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
        const walletSnap = await tx.get(walletRef);
        const wallet = walletSnap.exists ? walletSnap.data() : {};
        const balance = Number(wallet.balanceTZS || 0);
        const newBalance = balance + amount;
        tx.set(walletRef, { balanceTZS: newBalance, currency: "TZS", updatedAt: now }, { merge: true });
        tx.set(txRef, {
            uid: agentUid,
            amount,
            currency: "TZS",
            type: "commission_credit",
            description: "Commission from sale",
            status: "completed",
            sourceOrderId,
            participants: [agentUid],
            createdAt: now,
        });
    });
}
//# sourceMappingURL=commission.js.map