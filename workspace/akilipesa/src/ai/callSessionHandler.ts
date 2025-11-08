
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as openai from "./vendor/openai";
import * as runpod from "./vendor/runpod";
import { uploadTTSAudio } from "./storage";
import fetch from "node-fetch";

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
  const channelName = sessionData.channelName; // Assuming channelName is stored in the session

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
  
  const audioBuffer = Buffer.from(ttsResult.audio_b64, 'base64');

  // 5. Upload the AI's audio reply to Storage & get a signed URL
  const { downloadUrl: ttsUrl } = await uploadTTSAudio(
    audioBuffer,
    sessionId,
    "opus"
  );
  
  // 6. Tell the AI Bot Publisher to *join and speak*
  await fetch(process.env.AI_BOT_ENDPOINT + "/join-and-play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: sessionData.agoraTokenForAI,   // Assuming you store the AI's token
      channelName,
      botUid: "akili-bot",
      ttsUrl,                      // 🔥 signed, temporary, safe
    }),
  });


  // 7. Update Session State
  await sessionRef.update({
    lastEmotion: emotion,
    lastPace: voice.pace,
    lastEnergy: voice.energy,
    lastLanguage: voice.language,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 8. Return success (no audio payload needed as it's streamed by the bot)
  return {
    ok: true,
    reply_text: reply_text,
    guidance_mode,
  };
});
