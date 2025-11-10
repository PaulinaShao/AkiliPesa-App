
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as openai from "./vendor/openai";
import * as runpod from "./vendor/runpod";
import { getVoiceProfile, updateVoiceProfile } from "./voiceMemory";
import { uploadTTSAudio, uploadBufferToStorage, getV4SignedReadUrl } from "./storage";
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
export const callSessionHandler = onCall({ secrets: ["OPENAI_API_KEY", "RUNPOD_API_KEY", "AGORA_APP_ID", "AGORA_APP_CERT"] }, async (req) => {
  if (!req.auth) throw new Error("Unauthenticated");
  const { sessionId, audioChunkB64 } = req.data;
  const { uid: userId } = req.auth;

  if (!sessionId || !audioChunkB64) {
    throw new Error("Missing sessionId or audioChunkB64");
  }

  const sessionRef = db.collection("aiSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists || !sessionSnap.data()?.isActive) {
    throw new Error("Session is not active or does not exist.");
  }
  const sessionData = sessionSnap.data()!;
  const channelName = sessionData.channelName;
  const agentId = sessionData.agentId;

  // Check agent availability
  const agentAvailabilityRef = db.collection("agentAvailability").doc(agentId);
  const agentAvailabilitySnap = await agentAvailabilityRef.get();
  const availabilityData = agentAvailabilitySnap.data();

  if (!availabilityData?.isOnline || availabilityData?.busy) {
    throw new Error("Agent is currently unavailable.");
  }

  // Set agent to busy
  await agentAvailabilityRef.update({ busy: true });


  // 1. Speech-to-Text (STT) with RunPod Whisper
  const sttResult = await runpod.whisperSTT(audioChunkB64);
  if (sttResult.error || !sttResult.text) {
    console.error("STT failed:", sttResult.error);
    return { ok: false, error: "Failed to understand audio." };
  }
  const userText = sttResult.text;
  
  // 2. Load User Voice Profile & Memory
  const voiceProfile = await getVoiceProfile(userId);
  const memoryRef = db.collection("memory_context").doc(userId);
  const memorySnap = await memoryRef.get();
  const memoryData = memorySnap.exists() ? memorySnap.data() : {};

  // Handle "previous voice" request
  if (userText.match(/(voice|sauti).*back|rudi|first/i)) {
    await updateVoiceProfile(userId, {
      currentVoiceId: voiceProfile.voiceHistory?.[0]?.voiceId || "akili_sw_warm_soft"
    });
  }
  
  // Detect language usage patterns
  const containsEnglish = /[a-zA-Z]/.test(userText);
  let languageMode = containsEnglish ? "mix" : "sw";
  
  // Estimate speech speed → used for accent matching
  const fastSpeech = userText.split(" ").length > 8;
  let accent = fastSpeech ? "english_african" : "tanzania_standard";


  // 3. LLM Reasoning with OpenAI GPT-4o
  const gptResponse = await openai.getAiResponse({
    userText,
    sessionContext: {
      lastEmotion: sessionData.lastEmotion,
      lastEnergy: sessionData.lastEnergy,
      lastPace: sessionData.lastPace,
      languageMode,
      accent,
    },
    memoryContext: { ...memoryData, voiceProfile },
  });

  if (gptResponse.error || !gptResponse.data) {
    console.error("GPT-4o failed:", gptResponse.error);
    return { ok: false, error: "AI failed to generate a response." };
  }
  const { reply_text, voice, emotion, guidance_mode } = gptResponse.data;

  // 4. Text-to-Speech (TTS) with RunPod OpenVoice
  const ttsResult = await runpod.openVoiceTTS({
    text: reply_text,
    voice_id: voiceProfile.currentVoiceId || 'akili_sw_warm_soft',
    ...voice,
  });

  if (ttsResult.error || !ttsResult.audio_b64) {
    console.error("TTS failed:", ttsResult.error);
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
      token: sessionData.agoraTokenForAI,
      channelName,
      botUid: "akili-bot",
      ttsUrl,
    }),
  });


  // 7. Update Session State & Voice Profile
  await sessionRef.update({
    lastEmotion: emotion,
    lastPace: voice.pace,
    lastEnergy: voice.energy,
    lastLanguage: voice.language,
    preferredVoice: voice.accent, // Per prompt instructions
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  await updateVoiceProfile(userId, {
    currentVoiceId: voice.tone + "_" + voice.accent,
    personalitySignature: voice,
    lastAdaptedAt: admin.firestore.FieldValue.serverTimestamp()
  });


  // 8. Return success (no audio payload needed as it's streamed by the bot)
  return {
    ok: true,
    reply_text: reply_text,
    guidance_mode,
  };
});

/**
 * Enqueue one TTS line for live playback in an Agora channel.
 * The Cloud Run AI-bot listens to /ai_audio_queue and injects the audio.
 */
export const enqueueTTS = onCall({secrets: ["RUNPOD_API_KEY"]}, async (req) => {
  const { channelName, text, voice } = req.data as { channelName: string; text: string; voice?: any };
  if (!req.auth) throw new Error('Unauthenticated');

  // 1) TTS via OpenVoice/RunPod (Buffer)
  const audioBuffer = await runpod.synthesizeVoice(text, {
    tone: voice?.tone ?? 'balanced',
    pace: voice?.pace ?? 1.0,
    energy: voice?.energy ?? 1.0,
    language: voice?.language ?? 'sw',
  });

  // 2) Upload to Storage
  const sessionId = req.auth.uid + '-' + Date.now();
  const path = `ai-outputs/${req.auth.uid}/${sessionId}/line-${Date.now()}.opus`;
  await uploadBufferToStorage({ bucketPath: path, buffer: audioBuffer, contentType: 'audio/ogg' });
  const signedUrl = await getV4SignedReadUrl(path, 60);

  // 3) Push to queue (Cloud Run bot listens here)
  const queueRef = db.collection('ai_audio_queue').doc();
  await queueRef.set({
    channelName,
    url: signedUrl,             // signed URL to OPUS file
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
    type: 'tts',
  });

  return { ok: true, ttsUrl: signedUrl, queueId: queueRef.id };
});
