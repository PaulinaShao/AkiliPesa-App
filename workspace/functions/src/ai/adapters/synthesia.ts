import { SYNTHESIA_API_KEY } from "../../config/secrets.js";
import fetch from "node-fetch";
import { AIResult } from "./types.js";

export async function synthesiaAvatarVideo(payload: any): Promise<AIResult> {
  // TODO: real Synthesia API
  return {
    vendor: "synthesia",
    mode: "video",
    type: "video",
    url: "https://example.com/synthesia-avatar.mp4",
    meta: { payload },
  };
}
