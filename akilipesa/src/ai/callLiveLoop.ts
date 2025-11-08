
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as wallet from "./walletManager";
import { endAiCall } from "./endAiCall";

const db = admin.firestore();

/**
 * Scheduled function that runs every 30 seconds.
 * - Iterates through active AI call sessions.
 * - Updates their duration.
 * - Deducts cost from the user's wallet.
 * - Ends the call if the user has insufficient funds.
 */
export const callLiveLoop = onSchedule("every 30 seconds", async () => {
  const activeSessionsQuery = db.collection("aiSessions").where("isActive", "==", true);
  const snapshot = await activeSessionsQuery.get();

  if (snapshot.empty) {
    console.log("No active AI sessions to process.");
    return;
  }

  const promises = snapshot.docs.map(async (doc) => {
    const session = doc.data();
    const sessionId = doc.id;
    const userId = session.userId;

    if (!userId) {
      console.warn(`Session ${sessionId} is missing a userId. Skipping.`);
      return;
    }

    const pricePer30s = await wallet.getRateForPlan(userId) * 30;

    try {
      const hasFunds = await wallet.hasSufficientCredits(userId, pricePer30s);

      if (hasFunds) {
        // Deduct credits and update duration
        await wallet.deductCredits(userId, pricePer30s);
        await doc.ref.update({
          durationSec: admin.firestore.FieldValue.increment(30),
          costCredits: admin.firestore.FieldValue.increment(pricePer30s),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Billed ${pricePer30s} credits to user ${userId} for session ${sessionId}.`);
      } else {
        // End the call due to insufficient funds
        console.log(`Insufficient funds for user ${userId}. Ending call for session ${sessionId}.`);
        await endAiCall({ sessionId });
      }
    } catch (error) {
      console.error(`Error processing billing for session ${sessionId} and user ${userId}:`, error);
      // Optionally, end the call on any billing error to be safe
      await endAiCall({ sessionId });
    }
  });

  await Promise.all(promises);
  console.log(`Processed billing for ${snapshot.size} active sessions.`);
});
