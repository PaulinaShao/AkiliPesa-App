import { AIResult } from "../adapters/types.js";
import { openaiImage } from "../adapters/openai.js";
import { runpodImage } from "../adapters/runpod.js";

export async function runImagePipeline(
  payload: { prompt: string },
  vendor: string
): Promise<AIResult> {
  if (vendor === "runpod") return runpodImage(payload.prompt);
  return openaiImage(payload.prompt);
}
