import { onCall } from "firebase-functions/v2/https";
import { db } from "../firebase.js";

import {
  RtcTokenBuilder,
  RtcRole,
  RtmTokenBuilder
} from "agora-token";

export const createCallToken = onCall(async (request) => {
  const data = request.data;

  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERT!;
  const channel = data.channel || "akilipesa";
  const uid = data.uid || 0;

  const role = RtcRole.PUBLISHER;

  const now = Math.floor(Date.now() / 1000);
  const expireTime = now + 3600;  // 1 hour
  const privilegeExpire = expireTime; // REQUIRED ARGUMENT #7

  // FIXED: agora-token requires 7 args
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channel,
    uid,
    role,
    expireTime,
    privilegeExpire   // <-- Missing argument added
  );

  // RTM token
  const rtmToken = RtmTokenBuilder.buildToken(
    appId,
    appCertificate,
    uid.toString(),
    expireTime
  );

  return {
    rtcToken,
    rtmToken,
    channel,
    uid
  };
});
