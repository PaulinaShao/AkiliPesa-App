
import { VendorPayload, VendorResult } from "./types";

export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { error: "Missing ELEVENLABS_API_KEY" };

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", { // Using a default voice ID
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: p.input,
        voice_settings: { stability: 0.4, similarity_boost: 0.8 }
      })
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      console.error("ElevenLabs API Error:", errorText);
      return { error: `ElevenLabs API failed with status ${response.status}: ${errorText}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return { outputUrl: dataUrl };
  } catch (e: any) {
    return { error: e.message };
  }
}
