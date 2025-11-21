
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase";

export const uploadVoice = onCall(
  { region: "us-central1" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

    const { storagePath, durationSec = 0 } = request.data || {};

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

    return { ok: true, id: ref.id };
  }
);
