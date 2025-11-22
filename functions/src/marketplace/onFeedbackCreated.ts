
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db, admin } from "../firebase.js";

export const onFeedbackCreated = onDocumentCreated(
  {
    region: "us-central1",
    document: "feedback/{feedbackId}",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const agentRef = db.collection("agents").doc(data.agentId);

    await agentRef.set(
      {
        feedbackCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }
);
