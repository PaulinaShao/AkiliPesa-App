// functions/src/ai/adapters/luma.ts
import { LUMA_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

const LUMA_BASE = "https://api.lumalabs.ai";

/**
 * Existing helper: create video job
 */
export async function lumaCreateVideo(prompt: string): Promise<any> {
  const r = await fetch(`${LUMA_BASE}/dream-machine/v1/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LUMA_API_KEY.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, duration: 5 }),
  });
  return await r.json(); // { job_id, status }
}

/**
 * Existing helper: get job status
 */
export async function lumaGetJob(jobId: string): Promise<any> {
  const r = await fetch(`${LUMA_BASE}/dream-machine/v1/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${LUMA_API_KEY.value()}` },
  });
  return await r.json(); // returns output URLs when done
}

/**
 * NEW: run() – what adapters/selector.ts expects (luma.run)
 * For now it just starts a job and returns the job id.
 * Frontend can poll later with lumaGetJob().
 */
export async function run(payload: any): Promise<any> {
  const prompt =
    payload?.prompt ??
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
