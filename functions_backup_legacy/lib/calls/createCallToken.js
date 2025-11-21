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
exports.createCallToken = void 0;
// functions/src/calls/createCallToken.ts
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const agora_access_token_1 = require("agora-access-token");
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    logger.warn("⚠️ AGORA_APP_ID or AGORA_APP_CERTIFICATE is not set in environment. " +
        "Set them using Firebase Functions env or secrets.");
}
/**
 * Callable: createCallToken
 * Input: { channelName: string, role?: 'host' | 'audience', expireSeconds?: number }
 * Uses current Firebase Auth user uid as Agora userAccount.
 */
exports.createCallToken = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
        throw new https_1.HttpsError("failed-precondition", "Agora environment variables not configured.");
    }
    const { channelName, role = "host", expireSeconds = 60 * 60 } = request.data || {};
    if (!channelName || typeof channelName !== "string") {
        throw new https_1.HttpsError("invalid-argument", "channelName is required (string).");
    }
    const agoraRole = role === "host" ? agora_access_token_1.RtcRole.PUBLISHER : agora_access_token_1.RtcRole.SUBSCRIBER;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expireTimestamp = currentTimestamp + expireSeconds;
    const userAccount = request.auth.uid;
    try {
        const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithAccount(AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, userAccount, agoraRole, expireTimestamp);
        logger.info("✅ Agora token created", {
            channelName,
            uid: userAccount,
            role,
        });
        return {
            appId: AGORA_APP_ID,
            channelName,
            token,
            uid: userAccount,
            role,
            expireAt: expireTimestamp,
        };
    }
    catch (err) {
        logger.error("❌ Failed to create Agora token", err);
        throw new https_1.HttpsError("internal", "Failed to generate Agora token: " + err.message);
    }
});
//# sourceMappingURL=createCallToken.js.map