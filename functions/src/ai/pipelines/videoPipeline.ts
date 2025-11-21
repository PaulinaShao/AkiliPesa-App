import { AIResult } from "../adapters/types";
import { kaiberVideo } from "../adapters/kaiber";
import { pikaVideo } from "../adapters/pika";
import { lumaVideo } from "../adapters/luma";

export async function runVideoPipeline(
  payload: any,
  vendor: string
): Promise<AIResult> {
  if (vendor === "kaiber") return kaiberVideo(payload);
  if (vendor === "pika") return pikaVideo(payload);
  if (vendor === "luma") return lumaVideo(payload);

  return kaiberVideo(payload);
}
