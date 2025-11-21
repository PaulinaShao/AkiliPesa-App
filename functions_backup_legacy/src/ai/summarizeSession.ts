import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * summarizeAiSession
 * Generates a simple textual summary and stores it on the aiSessions doc.
 */
export const summarizeAiSession = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { sessionId } = request.data as { sessionId?: string };
  if (!sessionId) {
    throw new HttpsError("invalid-argument", "sessionId is required.");
  }

  const ref = db.collection("aiSessions").doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Session not found.");
  }

  const data = snap.data()!;
  if (data.userId !== uid) {
    throw new HttpsError("permission-denied", "Not session owner.");
  }

  const lastMessage = data.lastMessage ?? "";
  const summary =
    lastMessage.length > 0
      ? `AI session summary (auto): last message was "${lastMessage.slice(
          0,
          120
        )}${lastMessage.length > 120 ? "…" : ""}".`
      : "AI session summary: session ended with no final user message.";

  await ref.set(
    {
      summary,
      summarizedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { summary };
});
