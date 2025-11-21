import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * endAiCall
 * Marks an aiSessions document as ended.
 */
export const endAiCall = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { sessionId, endReason = "user-ended" } = request.data as {
    sessionId?: string;
    endReason?: string;
  };

  if (!sessionId) {
    throw new HttpsError("invalid-argument", "sessionId is required.");
  }

  const ref = db.collection("aiSessions").doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Session not found.");
  }

  const data = snap.data();
  if (data?.userId !== uid) {
    throw new HttpsError("permission-denied", "Not session owner.");
  }

  await ref.set(
    {
      isActive: false,
      status: "ended",
      endReason,
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});
