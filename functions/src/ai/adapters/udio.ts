import { UDIO_API_KEY } from "../../config/secrets.js";
import fetch from "node-fetch";
import { AIResult } from "./types.js";

export async function udioMusic(prompt: string): Promise<AIResult> {
  // TODO: replace with real Udio API call when available
  const json = { message: "Udio placeholder" };

  return {
    vendor: "udio",
    mode: "music",
    type: "audio",
    url: "https://example.com/udio-placeholder.mp3",
    meta: json,
  };
}
