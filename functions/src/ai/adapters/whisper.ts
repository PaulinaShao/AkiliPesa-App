import fetch from "node-fetch";
import { WHISPER_API_KEY } from "../../config/secrets";
import { AIResult } from "./types";

/**
 * This is a placeholder – in many setups Whisper is accessed via OpenAI or your own server.
 */
export async function whisperTranscribe(audioUrl: string): Promise<AIResult> {
  // TODO: implement real Whisper / RunPod / custom endpoint call
  return {
    vendor: "whisper",
    mode: "audio",
    type: "text",
    text: "[transcript placeholder]",
    meta: { audioUrl },
  };
}
