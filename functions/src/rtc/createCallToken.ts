import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createRequire } from "module";

// Load CJS library inside ESM
const require = createRequire(import.meta.url);
const { RtcTokenBuilder, RtmTokenBuilder } = require("agora-access-token");

export const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
export const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");

export const createCallToken = onCall(
  { region: "us-central1", secrets: [AGORA_APP_ID, AGORA_APP_CERT] },
  async (request) => {
    const { channel, uid } = request.data;

    if (!channel || !uid) throw new Error("Missing channel or uid");

    const appId = AGORA_APP_ID.value();
    const appCert = AGORA_APP_CERT.value();

    const expireSeconds = 3600;
    const privilegeExpiredTs =
      Math.floor(Date.now() / 1000) + expireSeconds;

    const role = 1; // publisher

    // RTC
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCert,
      channel,
      uid,
      role,
      privilegeExpiredTs
    );

    // RTM
    const rtmToken = RtmTokenBuilder.buildToken(
      appId,
      appCert,
      String(uid),
      role,
      privilegeExpiredTs
    );

    return {
      channel,
      uid,
      rtcToken,
      rtmToken,
      expiresAt: privilegeExpiredTs,
    };
  }
);
