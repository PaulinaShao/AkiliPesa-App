import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { AGORA_APP_ID, AGORA_APP_CERT, OPENAI_API_KEY, RUNPOD_API_KEY } from "../config/secrets";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { runpodWhisperTranscribe } from "../adapters/runpod";
import { oaiChat, oaiTTS } from "../adapters/openai";
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

// 1) Start an AI call session (returns Agora token + session doc)
export const startAICall = onCall({ secrets: [AGORA_APP_ID, AGORA_APP_CERT] }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Auth required");
  const channelName = `akili_call_${Date.now()}`;
  const expire = 3600;
  const token = RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID.value(), AGORA_APP_CERT.value(), channelName, 0, RtcRole.PUBLISHER, expire);

  const sessionRef = await db.collection("ai_sessions").add({
    uid, channelName, status: "active", createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { appId: AGORA_APP_ID.value(), channelName, token, sessionId: sessionRef.id };
});

// 2) When a new audio chunk is uploaded (client creates a doc with {fileUrl})
export const onAudioChunk = onDocumentCreated({
    document: "ai_sessions/{sessionId}/chunks/{chunkId}",
    secrets: [OPENAI_API_KEY, RUNPOD_API_KEY]
}, async (event) => {
  const data = event.data?.data() as any;
  if (!data?.fileUrl) return;
  const sessionId = event.params.sessionId;

  // Transcribe via RunPod Whisper
  const endpointId = "YOUR_RUNPOD_WHISPER_ENDPOINT_ID"; // <-- set in code or env/Firestore config
  const text = await runpodWhisperTranscribe(data.fileUrl, endpointId);
  if (!text) {
      console.log("Whisper transcribed nothing.");
      return;
  }

  // Reason with OpenAI
  const reply = await oaiChat(text, "You are AkiliPesa AI. Be concise, warm, and helpful.");

  // TTS via OpenAI → save mp3 to Storage
  const mp3 = await oaiTTS(reply);
  const path = `ai-outputs/${sessionId}/replies/${Date.now()}.mp3`;
  const file = bucket.file(path);
  await file.save(mp3, { contentType: "audio/mpeg", resumable: false });
  const [url] = await file.getSignedUrl({ action: "read", expires: "03-09-2999" });

  // Write reply doc
  await db.collection("ai_sessions").doc(sessionId).collection("replies").add({
    text: reply, audioUrl: url, createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
