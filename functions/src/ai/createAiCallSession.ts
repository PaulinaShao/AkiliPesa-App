
// functions/src/ai/createAiCallSession.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase";

export const createAiCallSession = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    const {
      persona = "empathetic",
      language = "sw",
      agentId = "akili-ai",
      callType = "audio", // "audio" | "video"
      context = {},
    } = request.data || {};

    if (!["audio", "video"].includes(callType)) {
      throw new HttpsError(
        "invalid-argument",
        "callType must be 'audio' or 'video'."
      );
    }

    // Unique channel name for Agora room
    const channelName = `ai_${Date.now()}_${Math.floor(
      Math.random() * 99999
    )}`;

    const docRef = db.collection("aiCallSessions").doc();

    await docRef.set({
      id: docRef.id,
      channelName,
      callerId: auth.uid,
      agentId,
      agentType: "ai",
      persona,
      language,
      callType,
      context,
      status: "active", // active | ended | failed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      aiCallId: docRef.id,
      channelName,
      persona,
      language,
      callType,
    };
  }
);
