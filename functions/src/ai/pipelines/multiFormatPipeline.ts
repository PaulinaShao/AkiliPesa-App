// functions/src/ai/pipelines/multiFormatPipeline.ts

import type { AIResult, AiVendor } from "../adapters/types.js";

/**
 * Multi-format pipeline placeholder.
 *
 * In the future this will support:
 *   - text → image → video
 *   - audio → transcription → summary
 *   - image → description → audio narration
 *   - etc.
 */
export async function runMultiFormatPipeline(
  payload: any,
  vendor: AiVendor
): Promise<AIResult> {
  return {
    type: "multi",
    vendor: vendor.name,
    mode: "multi",
    text: "Multi-format pipeline placeholder",
    meta: {
      note: "Pipeline not implemented yet",
      payload,
    },
  };
}
