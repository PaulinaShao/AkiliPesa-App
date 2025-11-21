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
exports.callSessionHandler = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const agora_access_token_1 = require("agora-access-token");
const db = admin.firestore();
/**
 * Issues Agora/ZEGOCLOUD tokens for live AI calls and persists session metadata.
 */
exports.callSessionHandler = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { channelName, callType } = data;
    if (!channelName || !callType) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing channelName or callType.');
    }
    const uid = context.auth.uid;
    // TODO: Implement ZEGOCLOUD token generation if needed. This is for Agora.
    const appId = functions.config().agora.app_id;
    const appCertificate = functions.config().agora.app_certificate;
    if (!appId || !appCertificate) {
        throw new functions.https.HttpsError('failed-precondition', 'Agora credentials are not configured.');
    }
    const role = agora_access_token_1.RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    // IMPORTANT: 0 means the user ID will be assigned dynamically by Agora.
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, 0, role, privilegeExpiredTs);
    // Log the call session to Firestore
    const requestRef = db.collection('ai_requests').doc();
    await requestRef.set({
        uid,
        type: 'call',
        input: `Live ${callType} call in channel: ${channelName}`,
        vendor_used: 'agora',
        status: 'success', // Token generation is synchronous
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        token,
        channelName,
        appId,
        request_id: requestRef.id,
    };
});
//# sourceMappingURL=callSessionHandler.js.map