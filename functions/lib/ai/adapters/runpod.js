import fetch from "node-fetch";
import { RUNPOD_API_KEY } from "../../config/secrets.js";
const RUNPOD_ENDPOINT = "https://api.runpod.ai/v2/your-endpoint-id/run"; // TODO: replace
function runpodHeaders() {
    return {
        Authorization: `Bearer ${RUNPOD_API_KEY.value()}`,
        "Content-Type": "application/json",
    };
}
export async function runpodImage(prompt) {
    // TODO: map to your specific RunPod model schema
    const res = await fetch(RUNPOD_ENDPOINT, {
        method: "POST",
        headers: runpodHeaders(),
        body: JSON.stringify({ prompt }),
    });
    const json = await res.json();
    return {
        vendor: "runpod",
        mode: "image",
        type: "image",
        url: json.outputUrl || "",
        meta: json,
    };
}
export async function runpodVoiceClone(payload) {
    // placeholder for your OpenVoice / RunPod workflow
    return {
        vendor: "runpod",
        mode: "voice_clone",
        type: "audio",
        url: "https://example.com/voice-clone-placeholder.mp3",
        meta: { payload },
    };
}
