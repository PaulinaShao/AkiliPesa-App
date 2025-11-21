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
exports.joinExistingCall = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * joinExistingCall
 * Adds the caller as participant in callRooms/{callId}.
 */
exports.joinExistingCall = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    const { callId } = request.data;
    if (!callId) {
        throw new https_1.HttpsError("invalid-argument", "callId is required.");
    }
    const roomRef = db.collection("callRooms").doc(callId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
        throw new https_1.HttpsError("not-found", "Call room not found.");
    }
    const data = roomSnap.data() || {};
    const participants = data.participants || {};
    participants[uid] = {
        ...(participants[uid] || {}),
        role: participants[uid]?.role ?? "guest",
        joined: true,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await roomRef.set({
        participants,
        status: "live",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true };
});
//# sourceMappingURL=joinExistingCall.js.map