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
exports.onFeedbackCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * onFeedbackCreated
 * Trigger: feedback/{id} created
 * Adjusts trustScores and buyerTrust.
 */
exports.onFeedbackCreated = (0, firestore_1.onDocumentCreated)("feedback/{feedbackId}", async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    const { targetUserId, fromUserId, rating = 5 } = data;
    if (!targetUserId || !fromUserId)
        return;
    const trustRef = db.collection("trustScores").doc(targetUserId);
    const buyerRef = db.collection("buyerTrust").doc(fromUserId);
    await db.runTransaction(async (trx) => {
        const trustSnap = await trx.get(trustRef);
        const trust = trustSnap.data() || {
            trustScore: 50,
            totalReviews: 0,
        };
        const newTotalReviews = (trust.totalReviews || 0) + 1;
        const newScore = Math.min(100, Math.max(0, (trust.trustScore || 50) + (rating - 3) * 2 // tweakable formula
        ));
        trx.set(trustRef, {
            trustScore: newScore,
            totalReviews: newTotalReviews,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        const buyerSnap = await trx.get(buyerRef);
        const buyer = buyerSnap.data() || {
            buyerScore: 50,
            verifiedPurchases: 0,
        };
        trx.set(buyerRef, {
            buyerScore: Math.min(100, (buyer.buyerScore || 50) + 1),
            verifiedPurchases: (buyer.verifiedPurchases || 0) + 1,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
});
//# sourceMappingURL=feedback.js.map