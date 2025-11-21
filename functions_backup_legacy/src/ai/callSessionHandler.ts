// functions/src/ai/callSessionHandler.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Placeholder for a TTS queue processor (for AI voice).
 * Right now it just returns ok:true to keep the export valid.
 */
export const processTTSQueue = onCall(async () => {
  return { ok: true };
});

/**
 * callSessionHandler
 * Creates an Agora channel + token and a /calls doc for AI or human agent calls.
 */
export const callSessionHandler = onCall(async (req) => {
  const auth = req.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required.");

  const uid = auth.uid;
  const {
    mode = "video",
    calleeId = null,
    agentId = null,
    agentType = "ai", // "ai" | "user"
  } = req.data || {};

  const APP_ID = process.env.AGORA_APP_ID;
  const APP_CERT = process.env.AGORA_APP_CERTIFICATE;
  if (!APP_ID || !APP_CERT) {
    throw new HttpsError(
      "failed-precondition",
      "Agora credentials missing in environment."
    );
  }

  const channelName = `akili_${Date.now()}_${Math.floor(
    Math.random() * 99999
  )}`;
  const expire = 3600;
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERT,
    channelName,
    0,
    RtcRole.PUBLISHER,
    Math.floor(Date.now() / 1000) + expire
  );

  const callRef = db.collection("calls").doc();
  await callRef.set({
    callId: callRef.id,
    channelName,
    callerId: uid,
    calleeId,
    agentId,
    agentType,
    mode, // "audio" | "video"
    status: "active",
    pricePerSecondCredits: agentType === "ai" ? 1 : 3, // your chosen rates
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    appId: APP_ID,
    token,
    channelName,
    callId: callRef.id,
  };
});
