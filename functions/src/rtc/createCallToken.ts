import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { RtcTokenBuilder, RtcRole, RtmTokenBuilder } from "agora-token";
import { db } from "../firebase.js";

const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");

export const createCallToken = onCall(
  { secrets: [AGORA_APP_ID, AGORA_APP_CERT] },
  async (request) => {
    const channelName = request.data?.channel || "default_channel";
    const uid = request.data?.uid || 0;
    const role = RtcRole.PUBLISHER;

    const expirationTimeInSeconds = 3600;
    const privilegeExpireTime = Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID.value(),
      AGORA_APP_CERT.value(),
      channelName,
      uid,
      role,
      privilegeExpireTime
    );

    const rtmToken = RtmTokenBuilder.buildToken(
      AGORA_APP_ID.value(),
      AGORA_APP_CERT.value(),
      uid.toString(),
      privilegeExpireTime
    );

    return {
      rtcToken,
      rtmToken,
      channel: channelName,
      uid,
    };
  }
);
