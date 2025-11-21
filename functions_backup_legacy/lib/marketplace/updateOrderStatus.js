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
exports.updateOrderStatus = void 0;
// functions/src/marketplace/updateOrderStatus.ts
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Simple callable to update an order status from frontend / admin.
 * Example: "pending" → "paid" → "delivered".
 */
exports.updateOrderStatus = (0, https_1.onCall)({ region: "us-central1" }, async (req) => {
    const auth = req.auth;
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    }
    const { orderId, status } = req.data || {};
    if (!orderId || !status) {
        throw new https_1.HttpsError("invalid-argument", "orderId and status are required.");
    }
    await db.doc(`orders/${orderId}`).update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
//# sourceMappingURL=updateOrderStatus.js.map