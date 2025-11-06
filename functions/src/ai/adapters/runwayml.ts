
import { VendorPayload, VendorResult } from "./types";

export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.RUNWAYML_API_KEY;
  if (!key) return { error: "Missing RUNWAYML_API_KEY" };

  try {
    // 1) Create Task
    const createRes = await fetch("https://api.runwayml.com/v1/tasks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        workflow: "gen2", // if using Gen-2
        prompt: p.input,
        duration: 4, // video length seconds
        aspect_ratio: "16:9"
      })
    });

    const task = await createRes.json();
    if (!task?.id) return { error: "Failed to create Runway task" };

    // 2) Poll until completed
    let status = task.status;
    let outputUrl = null;
    while (status !== "succeeded" && status !== "failed") {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(`https://api.runwayml.com/v1/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${key}` }
      });
      const pollData = await poll.json();
      status = pollData.status;
      outputUrl = pollData.output?.[0]?.url || null;
    }

    if (status === "failed") return { error: "RunwayML generation failed" };

    return { outputUrl };
  } catch (e: any) {
    return { error: e.message };
  }
}
