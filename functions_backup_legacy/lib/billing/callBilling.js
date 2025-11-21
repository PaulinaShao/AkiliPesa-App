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
exports.callBillingTick = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const walletEngine_1 = require("../wallet/walletEngine");
const notifications_1 = require("../notifications/notifications");
const db = admin.firestore();
/**
 * Scheduled function: runs every minute (adjust in console if you want)
 * For all active callSessions, bills from lastBilledAt → now.
 */
exports.callBillingTick = (0, scheduler_1.onSchedule)("every 1 minutes", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db
        .collection("callSessions")
        .where("status", "==", "active")
        .get();
    if (snap.empty) {
        console.log("No active callSessions to bill.");
        return;
    }
    console.log(`Billing ${snap.size} active sessions...`);
    const promises = [];
    snap.forEach((docSnap) => {
        const sessionId = docSnap.id;
        const data = docSnap.data();
        const callerId = data.callerId;
        const mode = data.mode === "video" ? "video" : "audio";
        const startedAt = data.startedAt;
        const lastBilledAt = data.lastBilledAt || null;
        const from = lastBilledAt || startedAt;
        const seconds = (now.toMillis() - from.toMillis()) > 0
            ? Math.floor((now.toMillis() - from.toMillis()) / 1000)
            : 0;
        if (!callerId || seconds <= 0) {
            return;
        }
        promises.push((async () => {
            console.log(`Billing session ${sessionId} for ${seconds}s, caller=${callerId}, mode=${mode}`);
            const result = await (0, walletEngine_1.chargeCallUsage)(callerId, mode, seconds);
            // record a transaction for wallet debit (if any)
            if (result.chargedFromWalletTZS > 0) {
                await (0, walletEngine_1.createTransaction)({
                    uid: callerId,
                    type: "callDebit",
                    amount: -Math.abs(result.chargedFromWalletTZS),
                    currency: "TZS",
                    description: `Call billing (${mode})`,
                    metadata: { sessionId, seconds },
                });
            }
            // Update session's lastBilledAt + totalBilledSeconds
            await docSnap.ref.set({
                lastBilledAt: now,
                totalBilledSeconds: (data.totalBilledSeconds || 0) + seconds,
                updatedAt: now,
            }, { merge: true });
            // Evaluate balance + send notifications
            const status = (0, walletEngine_1.evaluateBalanceStatus)(result);
            if (status.lowWallet) {
                await (0, notifications_1.createNotification)({
                    userId: callerId,
                    type: "LOW_WALLET_BALANCE",
                    title: "Low wallet balance",
                    body: "Your AkiliPesa wallet balance is running low. Top up to avoid call interruptions.",
                    data: { sessionId },
                });
            }
            if (status.lowPlan) {
                await (0, notifications_1.createNotification)({
                    userId: callerId,
                    type: "LOW_PLAN_CREDITS",
                    title: "Low plan credits",
                    body: "Your plan credits are almost finished. Consider upgrading your package.",
                    data: { sessionId },
                });
            }
            if (status.outOfFunds) {
                // Mark session as ending and notify user
                await docSnap.ref.set({
                    status: "ending",
                    endReason: "insufficient_funds",
                    updatedAt: now,
                }, { merge: true });
                await (0, notifications_1.createNotification)({
                    userId: callerId,
                    type: "CALL_ENDED_NO_FUNDS",
                    title: "Call stopped – insufficient balance",
                    body: "Your call was stopped because your plan credits and wallet balance are depleted.",
                    data: { sessionId },
                });
            }
        })());
    });
    await Promise.all(promises);
    console.log("✅ callBillingTick completed.");
});
//# sourceMappingURL=callBilling.js.map