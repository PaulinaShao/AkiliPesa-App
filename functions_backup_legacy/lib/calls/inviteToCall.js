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
exports.inviteToCall = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * inviteToCall
 * Creates a callRooms doc + callInvites doc.
 */
exports.inviteToCall = (0, https_1.onCall)(async (request) => {
    const callerId = request.auth?.uid;
    if (!callerId) {
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    }
    const { calleeId, mode = "audio", agentId = "akilipesa-ai", } = request.data;
    if (!calleeId) {
        throw new https_1.HttpsError("invalid-argument", "calleeId is required.");
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    const roomRef = db.collection("callRooms").doc();
    const roomData = {
        callId: roomRef.id,
        hostId: callerId,
        participants: {
            [callerId]: {
                role: "host",
                joined: false,
                muted: false,
                cameraOn: mode === "video",
            },
            [calleeId]: {
                role: "guest",
                joined: false,
                muted: false,
                cameraOn: mode === "video",
            },
        },
        mode,
        agentId,
        status: "invited",
        layoutMode: "grid",
        createdAt: now,
        updatedAt: now,
    };
    await roomRef.set(roomData);
    const inviteRef = db.collection("callInvites").doc();
    await inviteRef.set({
        inviteId: inviteRef.id,
        callId: roomRef.id,
        from: callerId,
        to: calleeId,
        mode,
        status: "pending",
        createdAt: now,
        updatedAt: now,
    });
    return {
        callId: roomRef.id,
        inviteId: inviteRef.id,
    };
});
//# sourceMappingURL=inviteToCall.js.map