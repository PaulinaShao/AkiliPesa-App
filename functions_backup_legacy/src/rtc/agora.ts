import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";

if (!admin.apps.length) admin.initializeApp();

export const getAgoraToken = onCall(async (request) => {
  const { uid } = request.auth ?? {};
  if (!uid) throw new Error("User must be authenticated.");

  const { channel, role = "publisher" } = request.data ?? {};
  if (!channel) throw new Error("Missing channel name.");

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERT;

  if (!appId || !appCertificate) {
    throw new Error("Agora environment variables not set.");
  }

  // 🔹 Convert string UID to number or use 0 (Agora accepts UID=0 for string users)
  const agoraUid = Number.isNaN(Number(uid)) ? 0 : Number(uid);

  const expirationSeconds = 60 * 60; // 1 hour
  const agoraRole =
    role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channel,
    agoraUid,
    agoraRole,
    expirationSeconds
  );

  return { token };
});
