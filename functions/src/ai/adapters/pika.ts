import { PIKA_API_KEY } from "../../config/secrets.js";
import fetch from "node-fetch";
import { AIResult } from "./types.js";

export async function pikaVideo(payload: any): Promise<AIResult> {
  // TODO: real Pika API
  return {
    mode: "video",
    type: "video",
    url: "https://example.com/pika-video.mp4",
    meta: { payload },
  };
}
