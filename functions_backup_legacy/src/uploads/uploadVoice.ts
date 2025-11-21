// functions/src/uploads/uploadVoice.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * uploadVoice
 * Registers metadata for a voice file uploaded to Firebase Storage.
 * Frontend uploads the binary separately via SDK.
 */
export const uploadVoice = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { storagePath, durationSec = 0 } = request.data as {
    storagePath?: string;
    durationSec?: number;
  };

  if (!storagePath) {
    throw new HttpsError("invalid-argument", "storagePath is required.");
  }

  const ref = db.collection("voiceUploads").doc();
  await ref.set({
    id: ref.id,
    userId: uid,
    storagePath,
    durationSec,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: ref.id };
});
