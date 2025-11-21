import { LUMA_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";
import { AIResult } from "./types";

export async function lumaVideo(payload: any): Promise<AIResult> {
  // TODO: real Luma API
  return {
    vendor: "luma",
    mode: "video",
    type: "video",
    url: "https://example.com/luma-video.mp4",
    meta: { payload },
  };
}
