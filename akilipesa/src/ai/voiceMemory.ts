
import * as admin from "firebase-admin";
const db = admin.firestore();

export async function getVoiceProfile(uid: string) {
  const ref = db.collection("voiceProfiles").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    // First-time default: warm Swahili
    const defaultProfile = {
      preferredVoice: "akili_soft_swahili",
      accentStyle: "tanzania_standard",
      languageMode: "sw_first",
      avgSpeechSpeed: 1.0,
      avgWarmth: 1.1,
      avgEnergy: 0.9,
      memoryNotes: "First interaction with user.",
      emotionalHistory: [],
      lastCallEndedFeeling: "neutral",
      lastAdaptedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(defaultProfile);
    return defaultProfile;
  }
  return snap.data()!;
}

export async function updateVoiceProfile(uid: string, update: any) {
  return db.collection("voiceProfiles").doc(uid).set(update, { merge: true });
}
