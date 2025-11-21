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
exports.updateAgentRanks = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * updateAgentRanks
 * HTTP endpoint to recompute agentRanks collection.
 * You can later turn this into a scheduled function.
 */
exports.updateAgentRanks = (0, https_1.onRequest)(async (_req, res) => {
    try {
        const agentsSnap = await db
            .collection("users")
            .where("role", "==", "agent")
            .limit(500)
            .get();
        const batch = db.batch();
        for (const docSnap of agentsSnap.docs) {
            const user = docSnap.data();
            const uid = user.uid || docSnap.id;
            const trustSnap = await db.collection("trustScores").doc(uid).get();
            const trust = trustSnap.data() || { trustScore: 50 };
            const earningsSnap = await db
                .collection("agentEarnings")
                .doc(uid)
                .get();
            const earnings = earningsSnap.data() || { total: 0 };
            const score = (trust.trustScore || 50) + Math.min(50, earnings.total / 10000);
            let rank = "Bronze";
            if (score >= 120)
                rank = "Platinum";
            else if (score >= 90)
                rank = "Gold";
            else if (score >= 70)
                rank = "Silver";
            const ref = db.collection("agentRanks").doc(uid);
            batch.set(ref, {
                userId: uid,
                score,
                rank,
                trustScore: trust.trustScore || 50,
                earningsTotal: earnings.total || 0,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        res.status(200).send("Agent ranks updated.");
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to update ranks.");
    }
});
//# sourceMappingURL=updateAgentRanks.js.map