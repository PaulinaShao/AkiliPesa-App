
import fetch from "node-fetch";

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
const OPENVOICE_ENDPOINT = process.env.OPENVOICE_ENDPOINT!;

/**
 * STREAMING ENTRY (placeholder)
 */
export function startWhisperStream(channelName: string, onText: (t: string) => void) {
  console.log(`🎙️ Whisper placeholder for channel: ${channelName}`);
  // Later — connect Agora → PCM → Whisper
  // For now your call loop still works with direct text testing.
}

/**
 * TTS via OpenVoice Clone on RunPod
 */
export async function synthesizeVoice(text: string, voice: any): Promise<Buffer> {
  const res = await fetch(`https://api.runpod.ai/v2/${OPENVOICE_ENDPOINT}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RUNPOD_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        text,
        voice_id: voice?.id ?? "akili_base_voice",
        tone: voice?.tone ?? "soft",
        pace: voice?.pace ?? 1.0,
        energy: voice?.energy ?? 1.0,
        language: voice?.language ?? "sw",
        format: "opus48k",
      },
    }),
  });

  const json = await res.json();
  if (!json?.output?.audio_b64) {
    throw new Error('RunPod OpenVoice TTS failed to return audio.');
  }
  return Buffer.from(json.output.audio_b64, "base64");
}
