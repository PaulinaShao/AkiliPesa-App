import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * createAiCallSession
 * Creates a Firestore aiSessions document for an AI voice/chat session.
 * Collection: aiSessions/{sessionId}
 */
export const createAiCallSession = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { agentId = "akilipesa-ai", mode = "chat", initialMessage = "" } =
    (request.data as any) ?? {};

  if (!["chat", "audio", "video"].includes(mode)) {
    throw new HttpsError("invalid-argument", "Invalid session mode.");
  }

  const sessionRef = db.collection("aiSessions").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await sessionRef.set({
    sessionId: sessionRef.id,
    userId: uid,
    agentId,
    mode,
    isActive: true,
    createdAt: now,
    lastUpdated: now,
    lastMessage: initialMessage ?? "",
    meta: {
      source: "createAiCallSession",
      version: 1,
    },
  });

  return {
    sessionId: sessionRef.id,
  };
});
