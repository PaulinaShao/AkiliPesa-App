import { AIResult } from "../adapters/types";
import { runpodVoiceClone } from "../adapters/runpod";

export async function runVoiceClonePipeline(
  payload: any,
  vendor: string
): Promise<AIResult> {
  // For now we use RunPod as main clone engine.
  return runpodVoiceClone(payload);
}
