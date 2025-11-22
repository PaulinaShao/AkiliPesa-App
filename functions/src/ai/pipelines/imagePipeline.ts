import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runImagePipeline(
  payload: { prompt: string },
  vendor: AiVendor
): Promise<AIResult> {
  const res = await vendor.handle({
    mode: "image",
    prompt: payload.prompt,
  });

  return {
    type: "image",
    url: res.url,
  };
}
