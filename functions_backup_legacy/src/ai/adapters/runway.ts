import { RUNWAY_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

// Runway Gen-2 text-to-video job create
export async function runwayCreateVideo(prompt: string) {
  const r = await fetch("https://api.runwayml.com/v1/tasks", {
    method: "POST",
    headers: { Authorization: `Bearer ${RUNWAY_API_KEY.value()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      task: "text-to-video",
      params: { prompt, duration: 5 } // seconds
    })
  });
  return await r.json(); // { id, status, ... }
}

// Poll job
export async function runwayGetTask(id: string) {
  const r = await fetch(`https://api.runwayml.com/v1/tasks/${id}`, {
    headers: { Authorization: `Bearer ${RUNWAY_API_KEY.value()}` }
  });
  return await r.json(); // includes asset urls when complete
}
