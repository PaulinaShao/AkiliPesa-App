// functions/src/ai/pipelines/videoPipeline.ts
import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runVideoPipeline(
  payload: any,
  vendor: AiVendor,
  userId: string,
  extra: Record<string, any> = {}
): Promise<AIResult> {
  const prompt = payload?.prompt ?? "";

  const res = await vendor.handle({
    mode: "video",
    prompt,
    userId,
    extra,
  });

  return {
    type: "video",
    text: res.text,
    url: res.url,
    buffer: res.buffer,
    vendor: vendor.name,
    mode: "video",
    meta: res.meta,
  };
}
