
// functions/src/ai/summarizeSession.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase.js";
import { OPENAI_API_KEY } from "../config/secrets.js";
import { openaiText } from "./adapters/openai.js";

export const summarizeAiSession = onCall(
  { region: "us-central1", secrets: [OPENAI_API_KEY] },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    const { callId, type = "aiCallSessions" } = request.data || {};
    // type: "calls" | "aiCallSessions"

    if (!callId) {
      throw new HttpsError("invalid-argument", "callId is required.");
    }

    const parentCollection =
      type === "calls" ? "calls" : "aiCallSessions";

    const transcriptSnap = await db
      .collection(parentCollection)
      .doc(callId)
      .collection("transcripts")
      .orderBy("createdAt", "asc")
      .get();

    if (transcriptSnap.empty) {
      throw new HttpsError(
        "failed-precondition",
        "No transcripts found for this call."
      );
    }

    const conversation = transcriptSnap.docs
      .map((d) => {
        const data = d.data();
        return `${data.role || "user"}: ${data.text || ""}`;
      })
      .join("\n");

    const prompt = `
Fanya muhtasari mfupi wa mazungumzo yafuatayo kati ya mtumiaji na AI.
Andika kwa Kiswahili rahisi, na orodhesha mambo muhimu kwa point:

${conversation}
`;

    const result = await openaiText(prompt);
    const summary = result.text || "";

    const summaryRef = db.collection("callSummaries").doc(callId);

    await summaryRef.set({
      id: callId,
      callId,
      parentCollection,
      uid: auth.uid,
      summary,
      generatedBy: "ai",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      summary,
    };
  }
);
