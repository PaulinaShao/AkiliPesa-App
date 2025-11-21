"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runpodWhisperTranscribe = runpodWhisperTranscribe;
exports.run = run;
exports.cloneVoice = cloneVoice;
// functions/src/ai/adapters/runpod.ts
const secrets_1 = require("../../config/secrets");
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Existing helper: Whisper transcription via RunPod
 * (kept as-is for backwards compatibility)
 */
async function runpodWhisperTranscribe(fileUrl, endpointId) {
    const r = await (0, node_fetch_1.default)(`https://api.runpod.ai/v2/${endpointId}/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secrets_1.RUNPOD_API_KEY.value()}`,
        },
        body: JSON.stringify({ input: { audio_url: fileUrl } }),
    });
    const j = await r.json();
    return j.output?.text;
}
// Generic endpoints (configure in env)
const RUNPOD_GENERIC_ENDPOINT_ID = process.env.RUNPOD_GENERIC_ENDPOINT_ID || "";
const RUNPOD_CLONE_VOICE_ENDPOINT_ID = process.env.RUNPOD_CLONE_VOICE_ENDPOINT_ID || "";
/**
 * NEW: run() – what adapters/selector.ts expects
 * Generic text-style task on RunPod.
 */
async function run(payload) {
    if (!RUNPOD_GENERIC_ENDPOINT_ID || !secrets_1.RUNPOD_API_KEY.value()) {
        console.warn("RunPod generic endpoint not configured.");
        return {
            output: null,
            error: "runpod_not_configured",
            provider: "runpod",
        };
    }
    const prompt = payload?.prompt ??
        payload?.text ??
        (typeof payload === "string"
            ? payload
            : JSON.stringify(payload || {}));
    const r = await (0, node_fetch_1.default)(`https://api.runpod.ai/v2/${RUNPOD_GENERIC_ENDPOINT_ID}/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secrets_1.RUNPOD_API_KEY.value()}`,
        },
        body: JSON.stringify({ input: { prompt } }),
    });
    const j = await r.json();
    return {
        output: j.output ?? null,
        provider: "runpod",
    };
}
/**
 * NEW: cloneVoice() – what createVoiceClone.ts expects
 * The exact schema depends on your RunPod model; this is a
 * generic pattern that you can adapt once you know the fields.
 */
async function cloneVoice(params) {
    if (!RUNPOD_CLONE_VOICE_ENDPOINT_ID || !secrets_1.RUNPOD_API_KEY.value()) {
        const error = "runpod_voice_clone_not_configured";
        console.warn(error);
        return { error };
    }
    try {
        const r = await (0, node_fetch_1.default)(`https://api.runpod.ai/v2/${RUNPOD_CLONE_VOICE_ENDPOINT_ID}/run`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${secrets_1.RUNPOD_API_KEY.value()}`,
            },
            body: JSON.stringify({
                input: {
                    audio_base64: params.audioBase64,
                    name: params.voiceName,
                },
            }),
        });
        const j = await r.json();
        // Adjust these fields once you know your model's response
        const voiceId = j.output?.voiceId ||
            j.output?.id ||
            j.id;
        if (!voiceId) {
            return { error: "runpod_voice_id_missing" };
        }
        return { voiceId };
    }
    catch (e) {
        console.error("RunPod cloneVoice error:", e);
        return { error: e?.message || "runpod_clone_voice_failed" };
    }
}
//# sourceMappingURL=runpod.js.map