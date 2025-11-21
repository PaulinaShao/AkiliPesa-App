import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as elevenlabs from "./adapters/elevenlabs";
import * as runpod from "./adapters/runpod";

const db = admin.firestore();

export const createVoiceClone = onCall(async (req) => {
  if (!req.auth) throw new Error("Unauthenticated");
  const { uid } = req.auth;
  const { audioBase64, voiceName, vendor = "elevenlabs" } = req.data || {};
  if (!audioBase64 || !voiceName) throw new Error("Missing audioBase64 or voiceName");

  let result: { voiceId?: string; error?: string };
  if (vendor === "elevenlabs") {
    result = await elevenlabs.clone({ audioBase64, voiceName });
  } else {
    result = await runpod.cloneVoice({ audioBase64, voiceName });
  }
  if (result.error) throw new Error(result.error);

  const voiceId = result.voiceId!;
  await db.collection("voices").doc(uid).collection("userVoices").doc(voiceId).set({
    voiceId, name: voiceName, vendor,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  return { voiceId };
});
