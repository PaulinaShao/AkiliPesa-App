import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * socialPoster2
 * HTTP endpoint to create a post; can be used by Make.com or admin.
 */
export const socialPoster2 = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Use POST.");
      return;
    }

    const { authorId, caption, mediaUrl, type = "video" } = req.body || {};
    if (!authorId || !caption) {
      res.status(400).send("authorId and caption required.");
      return;
    }

    const ref = db.collection("posts").doc();
    await ref.set({
      id: ref.id,
      authorId,
      caption,
      mediaUrl: mediaUrl || "",
      type,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    });

    res.status(200).json({ id: ref.id });
  } catch (err: any) {
    console.error(err);
    res.status(500).send("Failed to create post.");
  }
});
