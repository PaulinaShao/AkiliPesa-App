import { onCall } from "firebase-functions/v2/https";
import { AGORA_APP_ID, AGORA_APP_CERT } from "../config/secrets.js";
import { RtcRole, RtmRole, RtcTokenBuilder, RtmTokenBuilder } from "agora-token";
export const createCallToken = onCall(async (req) => {
    const { channelName, uid } = req.data;
    if (!channelName || !uid) {
        throw new Error("Missing channelName or uid");
    }
    const appId = AGORA_APP_ID.value();
    const appCert = AGORA_APP_CERT.value();
    const expireTime = 3600; // 1 hour
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channelName, uid, RtcRole.PUBLISHER, privilegeExpireTime);
    const rtmToken = RtmTokenBuilder.buildToken(appId, appCert, uid.toString(), RtmRole.Rtm_User, privilegeExpireTime);
    return {
        rtcToken,
        rtmToken,
        expireAt: privilegeExpireTime,
    };
});
