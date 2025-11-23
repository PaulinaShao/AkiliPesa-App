import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runVideoPipeline(
  payload: any,
  vendor: AiVendor
): Promise<AIResult> {
  const res = await vendor.handle({
    mode: "video",
    prompt: payload?.prompt ?? "",
  });

  return {
    type: "video",
    text: res.text,
    url: res.url,
    buffer: res.buffer,
    vendor: vendor.name,
    mode: "video",
  };
}
