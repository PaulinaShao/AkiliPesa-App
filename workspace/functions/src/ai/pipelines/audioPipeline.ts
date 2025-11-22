import { AIResult } from "../adapters/types.js";
import { openaiTTS } from "../adapters/openai.js";
import { whisperTranscribe } from "../adapters/whisper.js";

interface AudioPayload {
  type: "tts" | "transcribe";
  text?: string;
  audioUrl?: string;
}

export async function runAudioPipeline(
  payload: AudioPayload,
  vendor: string
): Promise<AIResult> {
  if (payload.type === "tts") {
    return openaiTTS(payload.text || "");
  }

  if (payload.type === "transcribe") {
    return whisperTranscribe(payload.audioUrl || "");
  }

  throw new Error(`Unsupported audio type: ${payload.type}`);
}
