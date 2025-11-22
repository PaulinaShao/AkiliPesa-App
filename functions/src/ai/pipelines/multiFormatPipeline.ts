import { AIResult } from "../adapters/types.js";

/**
 * High-level “any format → any format” pipeline.
 * For now this is a placeholder that echoes payload; later we chain multiple adapters.
 */
export async function runMultiFormatPipeline(
  payload: any,
  vendor: string
): Promise<AIResult> {
  return {
    vendor,
    mode: "multi",
    type: "multi",
    text: "Multi-format pipeline placeholder",
    meta: { payload },
  };
}
