
import { AIResult } from "../adapters/types.js";
import { openaiText } from "../adapters/openai.js";

export async function runTextPipeline(
  payload: { prompt: string },
  vendor: string
): Promise<AIResult> {
  switch (vendor) {
    case "openai":
    default:
      return openaiText(payload.prompt);
  }
}
