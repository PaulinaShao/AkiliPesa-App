import { AIResult } from "../adapters/types.js";
import { runpodVoiceClone } from "../adapters/runpod.js";

export async function runVoiceClonePipeline(
  payload: any,
  vendor: string
): Promise<AIResult> {
  // For now we use RunPod as main clone engine.
  return runpodVoiceClone(payload);
}
