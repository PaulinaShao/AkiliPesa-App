import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as AgoraAccessToken from "agora-access-token";
export const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
export const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole } = AgoraAccessToken;
export const createCallToken = onCall({
    secrets: [AGORA_APP_ID, AGORA_APP_CERT],
    region: "us-central1",
}, async (request) => {
    const { channel, uid } = request.data;
    if (!channel || !uid) {
        throw new Error("Missing channel or uid");
    }
    const appId = AGORA_APP_ID.value();
    const appCert = AGORA_APP_CERT.value();
    if (!appId || !appCert) {
        throw new Error("Agora secrets not loaded");
    }
    const expireSeconds = 3600;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expireSeconds;
    // RTC TOKEN (6 args) for agora-access-token
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channel, uid, RtcRole.PUBLISHER, privilegeExpiredTs);
    // RTM TOKEN (5 args)
    const rtmToken = RtmTokenBuilder.buildToken(appId, appCert, String(uid), 1, // RTM role = 1
    privilegeExpiredTs);
    return {
        channel,
        uid,
        rtcToken,
        rtmToken,
        expiresAt: privilegeExpiredTs,
    };
});
