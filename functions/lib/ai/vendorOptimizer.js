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
exports.vendorOptimizer = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.vendorOptimizer = (0, scheduler_1.onSchedule)("every day 02:00", async () => {
    // Example: Calculate simple preference based on last 7 days profit per vendor
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snap = await db.collection("profit_tracking")
        .where("created_at", ">=", since)
        .get();
    const agg = {};
    snap.forEach((d) => {
        const v = d.data();
        const key = v.vendor || "unknown";
        agg[key] || (agg[key] = { revenue: 0, cost: 0, count: 0 });
        agg[key].revenue += v.revenue || 0;
        agg[key].cost += v.cost || 0;
        agg[key].count += 1;
    });
    const ranked = Object.entries(agg).map(([k, v]) => ({
        vendor: k,
        margin: v.revenue - v.cost,
        marginPerReq: (v.revenue - v.cost) / Math.max(1, v.count),
    })).sort((a, b) => b.marginPerReq - a.marginPerReq);
    await db.collection("settings").doc("routingWeights").set({
        ranked,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log("✅ vendorOptimizer ranking updated", ranked.slice(0, 5));
});
//# sourceMappingURL=vendorOptimizer.js.map