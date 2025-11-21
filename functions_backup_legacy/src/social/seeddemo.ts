import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * seeddemo
 * HTTP endpoint to quickly seed demo posts (admin only if you add checks).
 */
export const seeddemo = onRequest(async (req, res) => {
  try {
    const postsRef = db.collection("posts");
    const batch = db.batch();

    const demoPosts = [
      {
        authorId: "demo-agent-1",
        caption: "Karibu AkiliPesa – AI + Commerce demo!",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        type: "video",
      },
      {
        authorId: "demo-agent-2",
        caption: "Buy sunflower oil direct from farmers 🌻",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        type: "image",
      },
    ];

    demoPosts.forEach((p) => {
      const ref = postsRef.doc();
      batch.set(ref, { id: ref.id, ...p });
    });

    await batch.commit();
    res.status(200).send("Seeded demo posts.");
  } catch (err: any) {
    console.error(err);
    res.status(500).send("Failed to seed demo posts.");
  }
});
