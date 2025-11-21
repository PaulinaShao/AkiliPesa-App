
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase";


/**
 * endAiCall
 * Marks an aiCallSessions document as ended.
 */
export const endAiCall = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { aiCallId, reason = "user-ended" } = request.data as {
    aiCallId?: string;
    reason?: string;
  };

  if (!aiCallId) {
    throw new HttpsError("invalid-argument", "aiCallId is required.");
  }

  const ref = db.collection("aiCallSessions").doc(aiCallId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "AI Call Session not found.");
  }

  const data = snap.data();
  if (data?.callerId !== uid) {
    throw new HttpsError("permission-denied", "Not session owner.");
  }

  await ref.set(
    {
      status: "ended",
      endReason: reason,
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});
