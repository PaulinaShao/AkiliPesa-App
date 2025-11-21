
// functions/src/ai/createAiCallSession.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase";

export const createAiCallSession = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    const { uid } = request.auth;
    const {
      persona = "empathetic",
      language = "sw",
      agentId = "akili-ai",
    } = request.data || {};

    const channelName = `ai_${Date.now()}_${Math.floor(
      Math.random() * 99999
    )}`;

    const docRef = db.collection("aiCallSessions").doc();
    await docRef.set({
      id: docRef.id,
      channelName,
      callerId: uid,
      agentId,
      agentType: "ai",
      persona,
      language,
      status: "active",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true, aiCallId: docRef.id, channelName };
  }
);
