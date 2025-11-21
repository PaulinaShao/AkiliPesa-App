import { PIKA_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";
import { AIResult } from "./types";

export async function pikaVideo(payload: any): Promise<AIResult> {
  // TODO: real Pika API
  return {
    vendor: "pika",
    mode: "video",
    type: "video",
    url: "https://example.com/pika-video.mp4",
    meta: { payload },
  };
}
