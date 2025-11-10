
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { nanoid } from "nanoid";
import * as agora from "./vendor/agora";

const db = admin.firestore();

/**
 * Creates an AI call session, generates Agora tokens, and returns credentials to the client.
 * It also creates a call invite for the callee.
 */
export const createAiCallSession = onCall({ secrets: ["AGORA_APP_ID", "AGORA_APP_CERT"] }, async (req) => {
  if (!req.auth) {
    throw new Error("Unauthenticated: User must be logged in to create a call session.");
  }
  const { uid } = req.auth;
  const { mode = "audio", agentId } = req.data as { mode: "audio" | "video", agentId: string };

  if (!["audio", "video"].includes(mode)) {
    throw new Error("Invalid call mode specified. Must be 'audio' or 'video'.");
  }
  if (!agentId) {
    throw new Error("agentId is required to initiate a call.");
  }

  const sessionRef = db.collection("aiSessions").doc();
  const sessionId = sessionRef.id;
  const channelName = `akili_${nanoid(12)}`;

  // Generate tokens for both the user and the AI agent to join the channel
  const agoraTokens = agora.buildTokens(channelName);
  
  const sessionData = {
    sessionId,
    userId: uid,
    agentId,
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
    // Store the AI token securely for the backend bot to use
    agoraTokenForAI: agoraTokens.aiToken,
  };

  await sessionRef.set(sessionData);

  // Create a call invite for the target agent
  const inviteRef = db.collection("callInvites").doc(agentId);
  await inviteRef.set({
    callerId: uid,
    callerName: req.auth.token.name || "A user",
    channelName,
    sessionId,
    mode,
    status: "ringing",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    sessionId,
    channelName,
    // Only return the user's token to the client
    token: agoraTokens.userToken,
    uid, // The user's own UID for joining the channel
    appId: process.env.AGORA_APP_ID,
  };
});
