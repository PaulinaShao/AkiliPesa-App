// functions/src/rtc/createCallToken.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { AGORA_APP_ID, AGORA_APP_CERT } from "../config/secrets";
export const createCallToken = onCall({ region: "us-central1", secrets: [AGORA_APP_ID, AGORA_APP_CERT] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign-in required.");
    }
    const { channelName, role = "host", expireSeconds = 3600 } = request.data || {};
    if (!channelName) {
        throw new HttpsError("invalid-argument", "channelName is required.");
    }
    const appId = AGORA_APP_ID.value();
    const appCert = AGORA_APP_CERT.value();
    if (!appId || !appCert) {
        logger.error("Agora secrets not configured");
        throw new HttpsError("failed-precondition", "Agora credentials not configured.");
    }
    const agoraRole = role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const now = Math.floor(Date.now() / 1000);
    const expire = now + expireSeconds;
    const uid = request.auth.uid;
    const token = RtcTokenBuilder.buildTokenWithAccount(appId, appCert, channelName, uid, agoraRole, expire);
    return {
        ok: true,
        appId,
        token,
        channelName,
        uid,
        role,
        expireAt: expire,
    };
});
