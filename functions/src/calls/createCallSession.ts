// functions/src/calls/createCallSession.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase.js";

export const createCallSession = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    const { uid } = request.auth;
    const {
      mode = "video",
      calleeId = null,
      agentId = null,
      agentType = "ai",
      context = {},
    } = request.data || {};

    if (!["audio", "video"].includes(mode)) {
      throw new HttpsError(
        "invalid-argument",
        "mode must be 'audio' or 'video'."
      );
    }

    const channelName = `akili_${Date.now()}_${Math.floor(
      Math.random() * 99999
    )}`;

    const docRef = db.collection("callSessions").doc();
    await docRef.set({
      id: docRef.id,
      channelName,
      callerId: uid,
      calleeId,
      agentId,
      agentType,
      mode,
      status: "active",
      context,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true, callId: docRef.id, channelName };
  }
);
