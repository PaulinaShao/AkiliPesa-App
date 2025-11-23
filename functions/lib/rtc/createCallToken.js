import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Load agora-access-token using CJS require (the ONLY correct way)
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole, } = require("agora-access-token");
export const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
export const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");
export const createCallToken = onCall({
    region: "us-central1",
    secrets: [AGORA_APP_ID, AGORA_APP_CERT],
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
    const expireSeconds = 3600; // 1 hour
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expireSeconds;
    // --- RTC TOKEN (6 args) ---
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channel, uid, RtcRole.PUBLISHER, // Exists in agora-access-token
    privilegeExpiredTs);
    // --- RTM TOKEN (5 args) ---
    const rtmToken = RtmTokenBuilder.buildToken(appId, appCert, String(uid), RtmRole.PUBLISHER, privilegeExpiredTs);
    return {
        channel,
        uid,
        rtcToken,
        rtmToken,
        expiresAt: privilegeExpiredTs,
    };
});
