import { runpodVoiceClone } from "../adapters/runpod";
export async function runVoiceClonePipeline(payload, vendor) {
    // For now we use RunPod as main clone engine.
    return runpodVoiceClone(payload);
}
