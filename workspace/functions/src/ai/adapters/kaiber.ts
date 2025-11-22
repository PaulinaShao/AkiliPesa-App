import { KAIBER_API_KEY } from "../../config/secrets.js";
import fetch from "node-fetch";
import { AIResult } from "./types.js";

export async function kaiberVideo(payload: any): Promise<AIResult> {
  // TODO: real Kaiber API
  return {
    vendor: "kaiber",
    mode: "video",
    type: "video",
    url: "https://example.com/kaiber-video.mp4",
    meta: { payload },
  };
}
