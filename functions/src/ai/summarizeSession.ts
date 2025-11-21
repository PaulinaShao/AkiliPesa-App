
// functions/src/ai/summarizeSession.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase";
import { OPENAI_API_KEY } from "../config/secrets";
import { openAiVendor } from "./adapters/openai";

export const summarizeAiSession = onCall(
  { region: "us-central1", secrets: [OPENAI_API_KEY] },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");

    const { callId } = request.data || {};
    if (!callId) {
      throw new HttpsError("invalid-argument", "callId is required.");
    }

    const transcriptsSnap = await db
      .collection("calls")
      .doc(callId)
      .collection("transcripts")
      .orderBy("createdAt", "asc")
      .get();

    const fullText = transcriptsSnap.docs
      .map((d) => d.data().text || "")
      .join("\n");

    const prompt = `Tengeneza summary fupi, yenye point muhimu, ya mazungumzo haya kati ya mtumiaji na AI. Andika kwa Kiswahili rahisi:\n\n${fullText}`;

    const res = await openAiVendor.handle({
      mode: "chat",
      prompt,
      userId: auth.uid,
    });

    const summary = res.text || "";

    await db.collection("callSummaries").doc(callId).set({
      callId,
      uid: auth.uid,
      summary,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true, summary };
  }
);
