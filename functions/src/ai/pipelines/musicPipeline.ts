// functions/src/ai/pipelines/musicPipeline.ts
import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runMusicPipeline(
  payload: any,
  vendor: AiVendor,
  userId: string,
  extra: Record<string, any> = {}
): Promise<AIResult> {
  const prompt = payload?.prompt ?? payload?.text ?? "";

  const res = await vendor.handle({
    mode: "music",
    prompt,
    userId,
    extra,
  });

  return {
    type: "audio",
    text: res.text,
    url: res.url,
    buffer: res.buffer,
    vendor: vendor.name,
    mode: "music",
    meta: res.meta,
  };
}
