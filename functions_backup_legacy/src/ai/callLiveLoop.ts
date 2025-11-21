import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as openai from "./adapters/openai";
import * as elevenlabs from "./adapters/elevenlabs";

const db = admin.firestore();

export const callLiveLoop = onCall(async (req) => {
  if (!req.auth) throw new Error("Unauthenticated");
  const { uid } = req.auth;
  const { callId, transcript, voiceId = null, persona = "empathetic" } = req.data || {};
  if (!callId || !transcript) throw new Error("Missing callId or transcript");

  // 1) LLM response (OpenAI)
  const llm = await openai.chat({
    system: `You are AkiliPesa AI. Persona: ${persona}. Be concise, caring, highly intelligent.`,
    user: transcript
  });

  if (llm.error) {
    console.error("LLM Error in callLiveLoop:", llm.error);
    throw new Error(llm.error);
  }

  const replyText = llm.text ?? "I’m here. Tell me more.";

  // 2) TTS (ElevenLabs; use cloned voice if provided)
  const tts = await elevenlabs.speak({
    text: replyText,
    voiceId // null uses default
  });

  if (tts.error) {
    console.error("TTS Error in callLiveLoop:", tts.error);
    // We can still return the text even if TTS fails
  }

  // 3) Log to call transcript
  const transRef = db.collection("calls").doc(callId).collection("transcripts").doc();
  await transRef.set({
    uid,
    role: "assistant",
    text: replyText,
    audioUrl: tts.outputUrl || null,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  return { text: replyText, audioUrl: tts.outputUrl || null };
});
