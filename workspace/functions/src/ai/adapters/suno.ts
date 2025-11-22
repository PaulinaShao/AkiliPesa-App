import { SUNO_API_KEY } from "../../config/secrets.js";
import fetch from "node-fetch";
import { AIResult } from "./types.js";

export async function sunoMusic(prompt: string): Promise<AIResult> {
  // TODO: replace with real Suno API when integrated
  const json = { message: "Suno placeholder" };

  return {
    vendor: "suno",
    mode: "music",
    type: "audio",
    url: "https://example.com/suno-placeholder.mp3",
    meta: json,
  };
}
