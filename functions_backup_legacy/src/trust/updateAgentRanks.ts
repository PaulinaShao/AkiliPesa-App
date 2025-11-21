import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * updateAgentRanks
 * HTTP endpoint to recompute agentRanks collection.
 * You can later turn this into a scheduled function.
 */
export const updateAgentRanks = onRequest(async (_req, res) => {
  try {
    const agentsSnap = await db
      .collection("users")
      .where("role", "==", "agent")
      .limit(500)
      .get();

    const batch = db.batch();

    for (const docSnap of agentsSnap.docs) {
      const user = docSnap.data();
      const uid = user.uid || docSnap.id;

      const trustSnap = await db.collection("trustScores").doc(uid).get();
      const trust = trustSnap.data() || { trustScore: 50 };

      const earningsSnap = await db
        .collection("agentEarnings")
        .doc(uid)
        .get();
      const earnings = earningsSnap.data() || { total: 0 };

      const score = (trust.trustScore || 50) + Math.min(50, earnings.total / 10000);
      let rank = "Bronze";
      if (score >= 120) rank = "Platinum";
      else if (score >= 90) rank = "Gold";
      else if (score >= 70) rank = "Silver";

      const ref = db.collection("agentRanks").doc(uid);
      batch.set(ref, {
        userId: uid,
        score,
        rank,
        trustScore: trust.trustScore || 50,
        earningsTotal: earnings.total || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    res.status(200).send("Agent ranks updated.");
  } catch (err: any) {
    console.error(err);
    res.status(500).send("Failed to update ranks.");
  }
});
