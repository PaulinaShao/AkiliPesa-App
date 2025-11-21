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
exports.getAgoraToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const agora_access_token_1 = require("agora-access-token");
if (!admin.apps.length)
    admin.initializeApp();
exports.getAgoraToken = (0, https_1.onCall)(async (request) => {
    const { uid } = request.auth ?? {};
    if (!uid)
        throw new Error("User must be authenticated.");
    const { channel, role = "publisher" } = request.data ?? {};
    if (!channel)
        throw new Error("Missing channel name.");
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;
    if (!appId || !appCertificate) {
        throw new Error("Agora environment variables not set.");
    }
    // 🔹 Convert string UID to number or use 0 (Agora accepts UID=0 for string users)
    const agoraUid = Number.isNaN(Number(uid)) ? 0 : Number(uid);
    const expirationSeconds = 60 * 60; // 1 hour
    const agoraRole = role === "publisher" ? agora_access_token_1.RtcRole.PUBLISHER : agora_access_token_1.RtcRole.SUBSCRIBER;
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channel, agoraUid, agoraRole, expirationSeconds);
    return { token };
});
//# sourceMappingURL=agora.js.map