// functions/src/ai/pipelines/voiceClonePipeline.ts
import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runVoiceClonePipeline(
  payload: any,
  vendor: AiVendor,
  userId: string,
  extra: Record<string, any> = {}
): Promise<AIResult> {
  const prompt = payload?.prompt ?? "";

  const res = await vendor.handle({
    mode: "voice_clone",
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
    mode: "voice_clone",
    meta: res.meta,
  };
}
