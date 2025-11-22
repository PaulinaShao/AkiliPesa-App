import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import {
  RtcTokenBuilder,
  RtcRole,
  RtmTokenBuilder,
} from "agora-access-token";

const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");

export const createCallToken = onCall(
  {
    secrets: [AGORA_APP_ID, AGORA_APP_CERT],
    timeoutSeconds: 30,
  },
  async (request) => {
    const { channelName, uid } = request.data;

    if (!channelName || !uid) {
      throw new Error("Missing channelName or uid");
    }

    const appId = AGORA_APP_ID.value();
    const appCert = AGORA_APP_CERT.value();

    const expireTime = Math.floor(Date.now() / 1000) + 3600;

    // RTC token
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCert,
      channelName,
      Number(uid),
      RtcRole.PUBLISHER,
      expireTime
    );

    // RTM token
    const rtmToken = RtmTokenBuilder.buildToken(
      appId,
      appCert,
      String(uid),
      expireTime
    );

    return {
      rtcToken,
      rtmToken,
      channel: channelName,
      uid,
    };
  }
);
