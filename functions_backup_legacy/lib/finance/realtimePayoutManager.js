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
exports.realtimePayoutManager = void 0;
// functions/src/finance/realtimePayoutManager.ts
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Cron: check for payoutRequests that are approved and not yet processed.
 * For now it only logs; later you connect DPO / Flutterwave etc.
 */
exports.realtimePayoutManager = (0, scheduler_1.onSchedule)({
    schedule: "every 15 minutes",
    region: "us-central1",
}, async () => {
    const snap = await db
        .collection("payoutRequests")
        .where("status", "==", "approved")
        .where("processed", "==", false)
        .limit(50)
        .get();
    if (snap.empty)
        return;
    const batch = db.batch();
    snap.forEach((doc) => {
        batch.update(doc.ref, {
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
});
//# sourceMappingURL=realtimePayoutManager.js.map