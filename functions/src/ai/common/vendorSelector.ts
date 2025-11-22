//---------------------------------------------------------
// FIXED VENDOR SELECTOR — returns AiVendor object, not string
//---------------------------------------------------------

import { openAiVendor } from "../adapters/openai.js";
import type { AiVendor } from "../adapters/types.js";

// Expand here later
export const vendorRegistry: AiVendor[] = [openAiVendor];

export function selectVendor(mode: string): AiVendor {
  // Simple rule: always OpenAI for now
  return openAiVendor;
}
