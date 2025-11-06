
import { onCall } from "firebase-functions/v2/https";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import * as admin from "firebase-admin";
const db = admin.firestore();

export const callSessionHandler = onCall(async (req) => {
  if (!req.auth) throw new Error("Unauthenticated");
  const { uid } = req.auth;
  const { mode = "video" } = req.data || {};

  const APP_ID = process.env.AGORA_APP_ID!;
  const APP_CERT = process.env.AGORA_APP_CERTIFICATE!;
  if (!APP_ID || !APP_CERT) throw new Error("Agora credentials missing");

  const expire = 3600;
  const channel = `akili_${uid}_${Date.now()}`;
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERT,
    channel,
    0,
    RtcRole.PUBLISHER,
    expire
  );

  await db.collection("ai_calls").doc(channel).set({
    uid,
    mode,
    channel,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { token, channel, appId: APP_ID };
});
