import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runMusicPipeline(
  payload: any,
  vendor: AiVendor
): Promise<AIResult> {
  const res = await vendor.handle({
    mode: "music",
    prompt: payload?.prompt ?? payload?.text ?? "",
  });

  return {
    type: "audio",
    text: res.text,
    url: res.url,
    buffer: res.buffer,
    vendor: vendor.name,
    mode: "music",
  };
}
