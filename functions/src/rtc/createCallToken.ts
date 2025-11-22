
// CREATE OR OVERWRITE FILE: src/rtc/createCallToken.ts

import { onCall } from "firebase-functions/v2/https";
import {
  RtcTokenBuilder,
  RtmTokenBuilder
} from "agora-access-token";

// Import secrets (AGORA APP ID + AGORA APP CERTIFICATE)
import { defineSecret } from "firebase-functions/params";

const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");


export const createCallToken = onCall(
  {
    secrets: [AGORA_APP_ID, AGORA_APP_CERT],
    region: "us-central1",
  },
  async (request) => {
    const { channelName, uid } = request.data;

    if (!channelName || !uid) {
      throw new Error("channelName and uid are required");
    }

    // Agora roles (correct method)
    const role = RtcTokenBuilder.Role.PUBLISHER;

    const privilegeExpireTs = Math.floor(Date.now() / 1000) + 3600;

    // RTC TOKEN
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID.value(),
      AGORA_APP_CERT.value(),
      channelName,
      uid,
      role,
      privilegeExpireTs,
      privilegeExpireTs
    );

    // RTM TOKEN
    const rtmToken = RtmTokenBuilder.buildToken(
      AGORA_APP_ID.value(),
      AGORA_APP_CERT.value(),
      String(uid),
      privilegeExpireTs,
      privilegeExpireTs
    );

    return {
      rtcToken,
      rtmToken,
      channel: channelName,
      uid: uid,
    };
  }
);
