import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as openai from "./vendor/openai";
import * as runpod from "./vendor/runpod";

const db = admin.firestore();

/**
 * This function represents the AI agent's main processing loop.
 * It's triggered by the client to start processing audio.
 * In a real-world scenario, this would be a long-running process that listens
 * to an Agora stream. For this implementation, it simulates one cycle:
 * STT -> LLM -> TTS. The full loop would be more complex.
 *
 * It is designed to be stateless and resumable.
 */
export const callSessionHandler = onCall({ secrets: ["OPENAI_API_KEY", "RUNPOD_API_KEY"] }, async (req) => {
  if (!req.auth) throw new Error("Unauthenticated");
  const { sessionId, audioChunkB64 } = req.data;

  if (!sessionId || !audioChunkB64) {
    throw new Error("Missing sessionId or audioChunkB64");
  }

  const sessionRef = db.collection("aiSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists || !sessionSnap.data()?.isActive) {
    throw new Error("Session is not active or does not exist.");
  }
  const sessionData = sessionSnap.data()!;
  const userId = sessionData.userId;

  // 1. Speech-to-Text (STT) with RunPod Whisper
  const sttResult = await runpod.whisperSTT(audioChunkB64);
  if (sttResult.error || !sttResult.text) {
    console.error("STT failed:", sttResult.error);
    return { ok: false, error: "Failed to understand audio." };
  }
  const userText = sttResult.text;

  // 2. Get Memory and Real-time Context
  const memoryRef = db.collection("memory_context").doc(userId);
  const memorySnap = await memoryRef.get();
  const memoryData = memorySnap.exists() ? memorySnap.data() : {};

  // 3. LLM Reasoning with OpenAI GPT-4o
  const gptResponse = await openai.getAiResponse({
    userText,
    sessionContext: {
      lastEmotion: sessionData.lastEmotion,
      lastEnergy: sessionData.lastEnergy,
      lastPace: sessionData.lastPace,
    },
    memoryContext: memoryData,
  });

  if (gptResponse.error || !gptResponse.data) {
    console.error("GPT-4o failed:", gptResponse.error);
    return { ok: false, error: "AI failed to generate a response." };
  }
  const { reply_text, voice, emotion, guidance_mode } = gptResponse.data;

  // 4. Text-to-Speech (TTS) with RunPod OpenVoice
  const ttsResult = await runpod.openVoiceTTS({
    text: reply_text,
    voice_id: memoryData?.voiceProfile?.cloneId || "default", // Use user's clone or default
    ...voice,
  });

  if (ttsResult.error || !ttsResult.audio_b64) {
    console.error("TTS failed:", ttsResult.error);
    // Still update session with text response even if TTS fails
    await sessionRef.update({
      lastEmotion: emotion,
      lastPace: voice.pace,
      lastEnergy: voice.energy,
      lastLanguage: voice.language,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: false, error: "Failed to synthesize audio response." };
  }

  // 5. Update Session State
  await sessionRef.update({
    lastEmotion: emotion,
    lastPace: voice.pace,
    lastEnergy: voice.energy,
    lastLanguage: voice.language,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 6. Return audio to client
  // The client will receive this payload and publish the audio into the Agora channel.
  return {
    ok: true,
    audio_b64: ttsResult.audio_b64,
    reply_text: reply_text,
    guidance_mode,
  };
});
