import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as openai from "./vendor/openai";

const db = admin.firestore();
const MAX_SUMMARIES = 20;

/**
 * Summarizes a completed AI call session and updates the user's memory context.
 * This can be triggered by a Cloud Task or called directly.
 */
export const summarizeAiSession = onCall({ secrets: ["OPENAI_API_KEY"] }, async (req) => {
  const { sessionId } = req.data;
  if (!sessionId) {
    throw new Error("sessionId is required for summarization.");
  }

  const sessionRef = db.collection("aiSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    console.error(`Session ${sessionId} not found for summarization.`);
    return { ok: false, error: "Session not found." };
  }
  const sessionData = sessionSnap.data()!;
  const userId = sessionData.userId;

  // In a real app, you would aggregate the transcript here.
  // For this example, we'll use a placeholder transcript.
  const transcript = "User: Hello, I'm feeling a bit stressed today. AI: I understand. Let's talk through it calmly.";

  const summaryResult = await openai.summarizeText(transcript);
  if (summaryResult.error || !summaryResult.data) {
    console.error(`Failed to summarize transcript for session ${sessionId}:`, summaryResult.error);
    return { ok: false, error: "Failed to generate summary." };
  }

  const memoryRef = db.collection("memory_context").doc(userId);
  const newSummary = {
    ts: admin.firestore.FieldValue.serverTimestamp(),
    summary: summaryResult.data.summary,
    keyPhrases: summaryResult.data.keyPhrases,
    sentiment: summaryResult.data.moodPath,
  };

  // Atomically add the new summary and cap the array at 20 items.
  await db.runTransaction(async (transaction) => {
    const memoryDoc = await transaction.get(memoryRef);
    if (!memoryDoc.exists) {
      transaction.set(memoryRef, {
        lastSummaries: [newSummary],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const existingSummaries = memoryDoc.data()?.lastSummaries || [];
      const updatedSummaries = [newSummary, ...existingSummaries].slice(0, MAX_SUMMARIES);
      transaction.update(memoryRef, {
        lastSummaries: updatedSummaries,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  console.log(`Successfully summarized session ${sessionId} for user ${userId}.`);
  return { ok: true };
});
