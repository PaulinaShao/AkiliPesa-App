import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runTextPipeline(
  payload: { prompt: string },
  vendor: AiVendor
): Promise<AIResult> {
  const res = await vendor.handle({
    mode: "text",
    prompt: payload.prompt,
  });

  return {
    type: "text",
    text: res.text,
  };
}
