import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.RUNWAYML_API_KEY!;

export async function run(p: VendorPayload): Promise<VendorResult> {
  if (!KEY) return { error: "Missing RUNWAYML_API_KEY" };
  try {
    const create = await fetch("https://api.runwayml.com/v1/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        workflow: "gen2",
        prompt: p.input,
        duration: p.options?.duration ?? 4,
        aspect_ratio: p.options?.aspect_ratio ?? "16:9"
      })
    });
    const task = await create.json();
    if (!task?.id) return { error: JSON.stringify(task) };

    let status = task.status, outputUrl = null;
    while (status !== "succeeded" && status !== "failed") {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(`https://api.runwayml.com/v1/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${KEY}` }
      });
      const data = await poll.json();
      status = data.status;
      outputUrl = data.output?.[0]?.url || null;
    }
    return status === "failed" ? { error: "RunwayML generation failed" } : { outputUrl };
  } catch (e: any) {
    return { error: e.message };
  }
}
