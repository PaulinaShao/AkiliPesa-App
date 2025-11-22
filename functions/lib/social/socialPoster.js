import { onCall } from "firebase-functions/v2/https";
import { db, admin } from "../firebase.js";
export const socialPoster2 = onCall({ region: "us-central1" }, async () => {
    const now = Date.now();
    const snap = await db
        .collection("scheduledPosts")
        .where("status", "==", "pending")
        .get();
    for (const doc of snap.docs) {
        const job = doc.data();
        if (job.publishAt <= now) {
            const postRef = db.collection("posts").doc(job.postId);
            await postRef.update({
                published: true,
                publishedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await doc.ref.update({
                status: "completed",
                completedAt: new Date(),
            });
        }
    }
    return { ok: true };
});
