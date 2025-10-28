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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceTransactionUid = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Trigger runs when a transaction doc is created
exports.enforceTransactionUid = functions.firestore
    .document("transactions/{txId}")
    .onCreate(async (snap, context) => {
    var _a;
    const data = snap.data();
    const txRef = snap.ref;
    // If uid already present, no action needed
    if (data === null || data === void 0 ? void 0 : data.uid) {
        console.log(`✅ Transaction ${context.params.txId} already has uid: ${data.uid}`);
        return null;
    }
    // Try to infer from auth context or subfields
    const inferredUid = (data === null || data === void 0 ? void 0 : data.userId) ||
        (data === null || data === void 0 ? void 0 : data.buyerId) ||
        (data === null || data === void 0 ? void 0 : data.sellerId) ||
        ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) ||
        null;
    if (!inferredUid) {
        console.warn(`⚠️ Transaction ${context.params.txId} missing uid and no fallback`);
        return null;
    }
    // Patch document safely
    await txRef.set({
        uid: inferredUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`🛠️ UID auto-applied to transaction ${context.params.txId}: ${inferredUid}`);
    return null;
});
//# sourceMappingURL=enforceTransactionUid.js.map