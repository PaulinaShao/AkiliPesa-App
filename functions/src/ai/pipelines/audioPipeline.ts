import { AIResult } from "../adapters/types";
import { openaiTTS } from "../adapters/openai";
import { whisperTranscribe } from "../adapters/whisper";

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
