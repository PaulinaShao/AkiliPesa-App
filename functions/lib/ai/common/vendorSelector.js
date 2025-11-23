//---------------------------------------------------------
// FIXED VENDOR SELECTOR — returns AiVendor object, not string
//---------------------------------------------------------
import { openAiVendor } from "../adapters/openai.js";
// Expand here later
export const vendorRegistry = [openAiVendor];
export function selectVendor(mode) {
    // Simple rule: always OpenAI for now
    return openAiVendor;
}
