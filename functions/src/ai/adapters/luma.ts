import { LUMA_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

export async function lumaCreateVideo(prompt: string) {
  const r = await fetch("https://api.lumalabs.ai/dream-machine/v1/jobs", {
    method: "POST",
    headers: { Authorization: `Bearer ${LUMA_API_KEY.value()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration: 5 })
  });
  return await r.json(); // { job_id, status }
}

export async function lumaGetJob(jobId: string) {
  const r = await fetch(`https://api.lumalabs.ai/dream-machine/v1/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${LUMA_API_KEY.value()}` }
  });
  return await r.json(); // returns output URLs when done
}
