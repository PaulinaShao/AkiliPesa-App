import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * schedulePublisher2
 * HTTP endpoint that publishes scheduledPosts -> posts where publishAt <= now.
 */
export const schedulePublisher2 = onRequest(async (_req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();

    const scheduledSnap = await db
      .collection("scheduledPosts")
      .where("publishAt", "<=", now)
      .where("status", "==", "pending")
      .limit(50)
      .get();

    const batch = db.batch();

    scheduledSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const postRef = db.collection("posts").doc();

      batch.set(postRef, {
        ...data,
        id: postRef.id,
        status: "published",
        createdAt: now,
      });

      batch.update(docSnap.ref, {
        status: "published",
        publishedPostId: postRef.id,
        publishedAt: now,
      });
    });

    await batch.commit();
    res
      .status(200)
      .send(`Published ${scheduledSnap.size} scheduled posts to feed.`);
  } catch (err: any) {
    console.error(err);
    res.status(500).send("Failed to publish scheduled posts.");
  }
});
