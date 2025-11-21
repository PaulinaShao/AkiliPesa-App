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
exports.createCallSession = void 0;
// functions/src/calls/createCallSession.ts
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const agora_access_token_1 = require("agora-access-token");
const db = admin.firestore();
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    logger.warn("⚠️ AGORA_APP_ID or AGORA_APP_CERTIFICATE is not set in environment.");
}
/**
 * Callable: createCallSession
 * Input: { agentId: string, mode: 'audio' | 'video' }
 * Output: { callId, channelName, token, appId, uid, mode }
 */
exports.createCallSession = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
        throw new https_1.HttpsError("failed-precondition", "Agora environment variables are not configured.");
    }
    const data = request.data;
    const callerId = request.auth.uid;
    if (!data?.agentId || typeof data.agentId !== "string") {
        throw new https_1.HttpsError("invalid-argument", "agentId (string) is required.");
    }
    if (!["audio", "video"].includes(data.mode)) {
        throw new https_1.HttpsError("invalid-argument", "mode must be 'audio' or 'video'.");
    }
    const mode = data.mode;
    const calleeId = data.agentId;
    try {
        // ─────────────────────────────
        // 1) Create Firestore callSessions doc
        // ─────────────────────────────
        const sessionRef = db.collection("callSessions").doc();
        const channelName = `call_${sessionRef.id}`;
        const participants = {
            [callerId]: { role: "caller", joined: false },
            [calleeId]: { role: "callee", joined: false },
        };
        await sessionRef.set({
            id: sessionRef.id,
            channelName,
            mode,
            callerId,
            calleeId,
            participants,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "pending", // pending → active → ended
            layoutMode: "grid",
            billing: {
                perSecondRate: mode === "audio" ? 1 : 3, // credits/sec (your rule)
                startedAt: null,
                endedAt: null,
                totalBilledSeconds: 0,
            },
        });
        // ─────────────────────────────
        // 2) Generate Agora token for caller (host)
        // ─────────────────────────────
        const agoraRole = agora_access_token_1.RtcRole.PUBLISHER;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const expireTimestamp = currentTimestamp + 60 * 60; // 1 hour
        const userAccount = callerId;
        const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithAccount(AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, userAccount, agoraRole, expireTimestamp);
        logger.info("✅ Created callSession + Agora token", {
            callId: sessionRef.id,
            channelName,
            mode,
            callerId,
            calleeId,
        });
        return {
            callId: sessionRef.id,
            channelName,
            appId: AGORA_APP_ID,
            token,
            uid: callerId,
            mode,
            expireAt: expireTimestamp,
        };
    }
    catch (err) {
        logger.error("❌ Failed to create callSession", err);
        throw new https_1.HttpsError("internal", "Failed to create call session: " + err.message);
    }
});
//# sourceMappingURL=createCallSession.js.map