import { DEEPMOTION_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";
import { AIResult } from "./types";

export async function deepmotionAnimate(payload: any): Promise<AIResult> {
  // TODO: plug into DeepMotion animation API
  return {
    vendor: "deepmotion",
    mode: "multi",
    type: "video",
    url: "https://example.com/deepmotion-animation.mp4",
    meta: { payload },
  };
}
