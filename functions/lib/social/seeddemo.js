import { onCall } from "firebase-functions/v2/https";
import { db, admin } from "../firebase/index.js";
export const seeddemo = onCall({ region: "us-central1" }, async () => {
    const ref = db.collection("posts").doc();
    await ref.set({
        id: ref.id,
        text: "Karibu AkiliPesa!",
        imageUrl: "",
        likes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
