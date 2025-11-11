import { STABILITY_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

// SDXL text-to-image
export async function sdxlImage(prompt: string) {
  const r = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY.value()}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, output_format: "png", aspect_ratio: "1:1" })
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return (j as any).image; // base64
}
