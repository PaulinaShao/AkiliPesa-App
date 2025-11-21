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
exports.callSessionHandler = exports.processTTSQueue = void 0;
// functions/src/ai/callSessionHandler.ts
const https_1 = require("firebase-functions/v2/https");
const agora_access_token_1 = require("agora-access-token");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Placeholder for a TTS queue processor (for AI voice).
 * Right now it just returns ok:true to keep the export valid.
 */
exports.processTTSQueue = (0, https_1.onCall)(async () => {
    return { ok: true };
});
/**
 * callSessionHandler
 * Creates an Agora channel + token and a /calls doc for AI or human agent calls.
 */
exports.callSessionHandler = (0, https_1.onCall)(async (req) => {
    const auth = req.auth;
    if (!auth)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    const uid = auth.uid;
    const { mode = "video", calleeId = null, agentId = null, agentType = "ai", // "ai" | "user"
     } = req.data || {};
    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERT = process.env.AGORA_APP_CERTIFICATE;
    if (!APP_ID || !APP_CERT) {
        throw new https_1.HttpsError("failed-precondition", "Agora credentials missing in environment.");
    }
    const channelName = `akili_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
    const expire = 3600;
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERT, channelName, 0, agora_access_token_1.RtcRole.PUBLISHER, Math.floor(Date.now() / 1000) + expire);
    const callRef = db.collection("calls").doc();
    await callRef.set({
        callId: callRef.id,
        channelName,
        callerId: uid,
        calleeId,
        agentId,
        agentType,
        mode, // "audio" | "video"
        status: "active",
        pricePerSecondCredits: agentType === "ai" ? 1 : 3, // your chosen rates
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        appId: APP_ID,
        token,
        channelName,
        callId: callRef.id,
    };
});
//# sourceMappingURL=callSessionHandler.js.map