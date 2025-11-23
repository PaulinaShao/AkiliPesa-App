import { onCall } from "firebase-functions/v2/https";
import { db } from "../firebase/index.js";
export const updateAgentRanks = onCall({ region: "us-central1" }, async () => {
    const agentsSnap = await db.collection("agents").get();
    for (const doc of agentsSnap.docs) {
        const data = doc.data();
        const feedback = data.feedbackCount || 0;
        const jobs = data.jobsCompleted || 0;
        const disputes = data.disputes || 0;
        const score = feedback * 5 + jobs * 2 - disputes * 3;
        await doc.ref.update({
            trustScore: score,
            updatedAt: new Date(),
        });
    }
    return { ok: true };
});
