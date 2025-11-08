import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { nanoid } from "nanoid";
import * as agora from "./vendor/agora";

const db = admin.firestore();

/**
 * Creates an AI call session, generates Agora tokens, and returns credentials to the client.
 */
export const createAiCallSession = onCall({ secrets: ["AGORA_APP_ID", "AGORA_APP_CERT"] }, async (req) => {
  if (!req.auth) {
    throw new Error("Unauthenticated: User must be logged in to create a call session.");
  }
  const { uid } = req.auth;
  const { mode = "audio" } = req.data as { mode: "audio" | "video" };

  if (!["audio", "video"].includes(mode)) {
    throw new Error("Invalid call mode specified. Must be 'audio' or 'video'.");
  }

  const sessionId = db.collection("aiSessions").doc().id;
  const channelName = `akili_${nanoid(12)}`;

  // Generate tokens for both the user and the AI agent to join the channel
  const agoraTokens = agora.buildTokens(channelName);
  
  const sessionData = {
    sessionId,
    userId: uid,
    isActive: true,
    mode,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    durationSec: 0,
    costCredits: 0,
    channelName,
    aiRole: "balanced",
    lastEmotion: "neutral",
    lastLanguage: "en",
    lastEnergy: "medium",
    lastPace: "medium",
  };

  await db.collection("aiSessions").doc(sessionId).set(sessionData);

  // For video mode, provide a placeholder for the AI's avatar video stream
  const aiAvatarStreamURL = mode === "video" ? "rtmp://ai-avatar.akilipesa.com/live/akili-avatar" : undefined;

  return {
    sessionId,
    channelName,
    agoraTokenForUser: agoraTokens.userToken,
    agoraTokenForAI: agoraTokens.aiToken,
    appId: process.env.AGORA_APP_ID,
    aiAvatarStreamURL,
  };
});
