import { AIResult } from "../adapters/types";
import { openaiText } from "../adapters/openai";

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
