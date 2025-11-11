import { RUNPOD_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

// Whisper transcription via RunPod (example serverless endpoint id)
export async function runpodWhisperTranscribe(fileUrl: string, endpointId: string) {
  const r = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RUNPOD_API_KEY.value()}` },
    body: JSON.stringify({ input: { audio_url: fileUrl } })
  });
  const j = await r.json();
  return (j as any).output?.text as string;
}
