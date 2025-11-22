import { onCall } from "firebase-functions/v2/https";
import { db, admin } from "../firebase/index.js";

export const schedulePublisher2 = onCall(
  { region: "us-central1" },
  async (request) => {
    const { postId, publishAt } = request.data || {};

    const jobRef = db.collection("scheduledPosts").doc();

    await jobRef.set({
      id: jobRef.id,
      postId,
      publishAt,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true };
  }
);
