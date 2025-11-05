
import { VendorPayload, VendorResult } from "./types";

export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.RUNPOD_API_KEY;
  const endpoint = process.env.RUNPOD_OPENVOICE_ENDPOINT_ID;
  if (!key) return { error: "Missing RUNPOD_API_KEY" };
  if (!endpoint) return { error: "Missing RUNPOD_OPENVOICE_ENDPOINT_ID" };

  try {
    // Submit job
    const jobRes = await fetch(`https://api.runpod.ai/v2/${endpoint}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: {
          text: p.input,
          voice_id: "default", // or user-selected voice id
        }
      })
    });

    const job = await jobRes.json();
    if (!job?.id) return { error: "RunPod job creation failed" };

    // Poll
    let state = "IN_PROGRESS";
    let output = null;

    while (state === "IN_PROGRESS" || state === "QUEUED") {
      await new Promise(r => setTimeout(r, 4000));
      const poll = await fetch(`https://api.runpod.ai/v2/${endpoint}/status/${job.id}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const pollData = await poll.json();
      state = pollData.status;
      output = pollData.output || null;
    }

    if (!output?.audio_base64) return { error: "RunPod returned no audio" };

    return { outputUrl: `data:audio/wav;base64,${output.audio_base64}` };

  } catch (e: any) {
    return { error: e.message };
  }
}
