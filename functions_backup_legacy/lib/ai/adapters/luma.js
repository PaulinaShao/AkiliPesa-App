"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lumaCreateVideo = lumaCreateVideo;
exports.lumaGetJob = lumaGetJob;
exports.run = run;
// functions/src/ai/adapters/luma.ts
const secrets_1 = require("../../config/secrets");
const node_fetch_1 = __importDefault(require("node-fetch"));
const LUMA_BASE = "https://api.lumalabs.ai";
/**
 * Existing helper: create video job
 */
async function lumaCreateVideo(prompt) {
    const r = await (0, node_fetch_1.default)(`${LUMA_BASE}/dream-machine/v1/jobs`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secrets_1.LUMA_API_KEY.value()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, duration: 5 }),
    });
    return await r.json(); // { job_id, status }
}
/**
 * Existing helper: get job status
 */
async function lumaGetJob(jobId) {
    const r = await (0, node_fetch_1.default)(`${LUMA_BASE}/dream-machine/v1/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${secrets_1.LUMA_API_KEY.value()}` },
    });
    return await r.json(); // returns output URLs when done
}
/**
 * NEW: run() – what adapters/selector.ts expects (luma.run)
 * For now it just starts a job and returns the job id.
 * Frontend can poll later with lumaGetJob().
 */
async function run(payload) {
    const prompt = payload?.prompt ??
        payload?.text ??
        (typeof payload === "string"
            ? payload
            : "AkiliPesa AI video");
    const job = await lumaCreateVideo(prompt);
    return {
        output: job?.job_id || null,
        provider: "luma",
    };
}
//# sourceMappingURL=luma.js.map