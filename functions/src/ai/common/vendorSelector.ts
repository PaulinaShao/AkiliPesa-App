import { db } from "../../firebase";

/**
 * Basic vendor selection.
 * Later: use vendorOptimizer config from Firestore.
 */
export async function selectVendor(mode: string): Promise<string> {
  // Example: read override from Firestore
  const configSnap = await db.collection("vendorConfig").doc("active").get();
  const preferred = configSnap.data()?.preferredVendors?.[mode];

  const defaults: Record<string, string[]> = {
    text: ["openai"],
    image: ["openai", "runpod"],
    audio: ["openai", "whisper"],
    tts: ["openai"],
    voice_clone: ["runpod"],
    music: ["udio", "suno"],
    video: ["kaiber", "pika", "luma"],
    multi: ["openai", "runpod"],
  };

  const options = (defaults[mode] || ["openai"]).slice();

  if (preferred && options.includes(preferred)) {
    return preferred;
  }

  return options[0];
}
