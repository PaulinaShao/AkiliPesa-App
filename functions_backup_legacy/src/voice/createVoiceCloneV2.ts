import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * createVoiceCloneV2
 * Enqueues a voice cloning job in voiceClones collection.
 */
export const createVoiceCloneV2 = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { sampleUrl, text, model = "openvoice-v2" } = request.data as {
    sampleUrl?: string;
    text?: string;
    model?: string;
  };

  if (!sampleUrl || !text) {
    throw new HttpsError(
      "invalid-argument",
      "sampleUrl and text are required."
    );
  }

  const ref = db.collection("voiceClones").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    id: ref.id,
    userId: uid,
    sampleUrl,
    text,
    model,
    status: "queued", // to be processed by external worker
    createdAt: now,
    updatedAt: now,
  });

  return { jobId: ref.id };
});
