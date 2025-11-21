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
exports.redeemReward = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * redeemReward
 * Callable to convert points into a reward.
 */
exports.redeemReward = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    const { cost = 10, rewardType = "voucher" } = request.data;
    if (cost <= 0) {
        throw new https_1.HttpsError("invalid-argument", "Invalid cost.");
    }
    const pointsRef = db.collection("akiliPoints").doc(uid);
    const historyRef = db.collection("rewardHistory").doc();
    await db.runTransaction(async (trx) => {
        const snap = await trx.get(pointsRef);
        const data = snap.data() || { points: 0 };
        if ((data.points || 0) < cost) {
            throw new https_1.HttpsError("failed-precondition", "Not enough points.");
        }
        trx.set(pointsRef, {
            points: (data.points || 0) - cost,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        trx.set(historyRef, {
            id: historyRef.id,
            userId: uid,
            delta: -cost,
            rewardType,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
//# sourceMappingURL=redeemReward.js.map