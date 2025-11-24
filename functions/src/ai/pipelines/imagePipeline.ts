// functions/src/ai/pipelines/imagePipeline.ts
import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runImagePipeline(
  payload: { prompt: string },
  vendor: AiVendor,
  userId: string,
  extra: Record<string, any> = {}
): Promise<AIResult> {
  const res = await vendor.handle({
    mode: "image",
    prompt: payload.prompt,
    userId,
    extra,
  });

  return {
    type: "image",
    url: res.url,
    vendor: vendor.name,
    mode: "image",
    meta: res.meta,
  };
}
