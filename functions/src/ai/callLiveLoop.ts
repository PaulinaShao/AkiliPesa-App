
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase";
import { openAiVendor } from "./adapters/openai";
import { OPENAI_API_KEY } from "../config/secrets";


export const callLiveLoop = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Unauthenticated");
  const { uid } = req.auth;
  const { callId, transcript, persona = "empathetic" } = req.data || {};
  if (!callId || !transcript) throw new HttpsError("invalid-argument", "Missing callId or transcript");

  // 1) LLM response (OpenAI)
  const llmResult = await openAiVendor.handle({
    mode: "chat",
    prompt: `Persona: ${persona}. User said: "${transcript}". Your reply:`,
    userId: uid,
  });

  if (!llmResult.ok || !llmResult.text) {
    console.error("LLM Error in callLiveLoop:", llmResult.raw);
    throw new HttpsError("internal", "LLM failed to generate a response");
  }

  const replyText = llmResult.text;

  // 2) TTS (OpenAI)
  const ttsResult = await openAiVendor.handle({
    mode: "tts",
    prompt: replyText,
    userId: uid,
  });

  if (!ttsResult.ok || !ttsResult.audioUrl) {
    console.error("TTS Error in callLiveLoop:", ttsResult.raw);
  }

  // 3) Log to call transcript
  const transRef = db.collection("calls").doc(callId).collection("transcripts").doc();
  await transRef.set({
    uid,
    role: "assistant",
    text: replyText,
    audioUrl: ttsResult.audioUrl || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { text: replyText, audioUrl: ttsResult.audioUrl || null };
});
