import { AIResult } from "../adapters/types";
import { openaiImage } from "../adapters/openai";
import { runpodImage } from "../adapters/runpod";

export async function runImagePipeline(
  payload: { prompt: string },
  vendor: string
): Promise<AIResult> {
  if (vendor === "runpod") return runpodImage(payload.prompt);
  return openaiImage(payload.prompt);
}
