import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = pkg;
const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");
export const createCallToken = onCall({
    secrets: [AGORA_APP_ID, AGORA_APP_CERT],
    timeoutSeconds: 30,
}, async (request) => {
    const { channelName, uid } = request.data;
    if (!channelName || !uid) {
        throw new HttpsError("invalid-argument", "Missing channelName or uid");
    }
    const appId = AGORA_APP_ID.value();
    const appCert = AGORA_APP_CERT.value();
    if (!appId || !appCert) {
        throw new HttpsError("failed-precondition", "Agora secrets are not configured on the server.");
    }
    // Unix timestamps
    const expireTs = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const privilegeExpiredTs = expireTs; // same expiry
    // RTC TOKEN (video/audio stream)
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channelName, Number(uid), RtcRole.PUBLISHER, expireTs, privilegeExpiredTs);
    // RTM TOKEN (messaging)
    const rtmToken = RtmTokenBuilder.buildToken(appId, appCert, String(uid), expireTs);
    return {
        rtcToken,
        rtmToken,
        channel: channelName,
        uid,
    };
});
