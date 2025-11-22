//---------------------------------------------------------
// MASTER VENDOR SELECTOR (FIXED WITH .js EXTENSIONS)
//---------------------------------------------------------
import { AiRequest, AiVendor } from "./types.js";
import { openAiVendor } from "./openai.js";

export const vendorRegistry: AiVendor[] = [openAiVendor];

export function selectVendorForMode(mode: string): AiVendor {
  const found = vendorRegistry.find(v => v.supports.includes(mode));
  if (found) {
    return found;
  }
  return vendorRegistry[0]; // default for now
}
