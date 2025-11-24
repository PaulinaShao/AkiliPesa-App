// functions/src/ai/pipelines/textPipeline.ts
import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runTextPipeline(
  payload: { prompt: string },
  vendor: AiVendor,
  userId: string,
  extra: Record<string, any> = {}
): Promise<AIResult> {
  const res = await vendor.handle({
    mode: "text",
    prompt: payload.prompt,
    userId,
    extra,
  });

  return {
    type: "text",
    text: res.text,
    vendor: vendor.name,
    mode: "text",
    meta: res.meta,
  };
}
