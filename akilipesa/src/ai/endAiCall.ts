
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { summarizeAiSession } from "./summarizeSession";

const db = admin.firestore();

/**
 * Ends an active AI call session, marks it as inactive, and triggers the summarization process.
 */
export const endAiCall = onCall(async (req) => {
  const { sessionId } = req.data;
  if (!sessionId) {
    throw new Error("sessionId is required.");
  }

  const sessionRef = db.collection("aiSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    console.warn(`Session ${sessionId} not found. Cannot end.`);
    return { ok: false, message: "Session not found." };
  }

  if (!sessionSnap.data()?.isActive) {
    console.log(`Session ${sessionId} is already inactive.`);
    return { ok: true, message: "Session already ended." };
  }

  await sessionRef.update({
    isActive: false,
    endedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Trigger the summarization task asynchronously
  // In a production app, this would use Cloud Tasks to ensure execution
  summarizeAiSession({ sessionId }).catch(err => {
    console.error(`Failed to trigger summarization for session ${sessionId}:`, err);
  });
  
  // TODO: Award points for the interaction
  // const sessionData = sessionSnap.data();
  // if (sessionData.userId && sessionData.durationSec > 60) {
  //   const points = Math.floor(sessionData.durationSec / 60) * 10;
  //   await awardPoints(sessionData.userId, points, "AI session engagement");
  // }

  console.log(`Successfully ended session ${sessionId}.`);
  return { ok: true, message: "Call ended successfully." };
});
