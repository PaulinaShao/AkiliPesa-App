import type { AIResult, AiVendor } from "../adapters/types.js";

export async function runMultiFormatPipeline(
  payload: any,
  vendor: AiVendor
): Promise<AIResult> {
  // For now this is a placeholder that just tags the request.
  // Later we can chain text → image → video, etc.
  return {
    type: "multi",
    text: "Multi-format pipeline placeholder",
    vendor: vendor.name,
    mode: "multi",
    meta: { payload },
  };
}
