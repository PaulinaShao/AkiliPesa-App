import { LUMA_API_KEY } from "../../config/secrets.js";
import fetch from "node-fetch";
import { AIResult } from "./types.js";

export async function lumaVideo(payload: any): Promise<AIResult> {
  // TODO: real Luma API
  return {
    mode: "video",
    type: "video",
    url: "https://example.com/luma-video.mp4",
    meta: { payload },
  };
}
