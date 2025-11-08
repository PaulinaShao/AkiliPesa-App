
import * as admin from "firebase-admin";
const db = admin.firestore();

export async function getVoiceProfile(uid: string) {
  const ref = db.collection("voiceProfiles").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    // First-time default: warm Swahili
    const defaultProfile = {
      currentVoiceId: "akili_sw_warm_soft",
      personalitySignature: {
        tone: "warm",
        pace: "steady",
        energy: "soft",
        languagePreference: "sw",
        accent: "tanzanian-neutral"
      },
      voiceHistory: [],
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
