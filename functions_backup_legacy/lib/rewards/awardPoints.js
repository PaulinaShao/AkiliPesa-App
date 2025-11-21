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
exports.onAIInteractionReward = exports.onReferralReward = exports.onProductSaleReward = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function addPoints(uid, delta, reason) {
    if (!uid || !delta)
        return;
    const pointsRef = db.collection("akiliPoints").doc(uid);
    await db.runTransaction(async (trx) => {
        const snap = await trx.get(pointsRef);
        const data = snap.data() || { points: 0, tier: "Free" };
        const newPoints = (data.points || 0) + delta;
        trx.set(pointsRef, {
            points: newPoints,
            lastReason: reason,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        const historyRef = db.collection("rewardHistory").doc();
        trx.set(historyRef, {
            id: historyRef.id,
            userId: uid,
            delta,
            reason,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
}
/**
 * onProductSaleReward
 * Trigger: sales/{saleId} created
 */
exports.onProductSaleReward = (0, firestore_1.onDocumentCreated)("sales/{saleId}", async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    const sellerId = data.sellerId;
    if (!sellerId)
        return;
    await addPoints(sellerId, 10, "Product sale");
});
/**
 * onReferralReward
 * Trigger: referrals/{referralId} created
 */
exports.onReferralReward = (0, firestore_1.onDocumentCreated)("referrals/{referralId}", async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    const referrerId = data.referrerId;
    if (!referrerId)
        return;
    await addPoints(referrerId, 5, "Referral signup");
});
/**
 * onAIInteractionReward
 * Trigger: aiSessions/{sessionId} updated
 * When session completes, give small reward.
 */
exports.onAIInteractionReward = (0, firestore_1.onDocumentUpdated)("aiSessions/{sessionId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.isActive && after.isActive === false) {
        const uid = after.userId;
        if (!uid)
            return;
        await addPoints(uid, 1, "AI session completed");
    }
});
//# sourceMappingURL=awardPoints.js.map