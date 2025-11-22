
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase.js";

export const createVoiceCloneV2 = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");

    const { referenceUploadId, displayName = "My Voice Clone" } =
      request.data || {};

    if (!referenceUploadId) {
      throw new HttpsError(
        "invalid-argument",
        "referenceUploadId is required."
      );
    }

    const cloneRef = db.collection("voiceClones").doc();
    await cloneRef.set({
      id: cloneRef.id,
      userId: auth.uid,
      referenceUploadId,
      displayName,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true, cloneId: cloneRef.id };
  }
);
