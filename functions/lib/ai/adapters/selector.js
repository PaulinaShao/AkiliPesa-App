import { openAiVendor } from "./openai.js";
export const vendorRegistry = [openAiVendor];
export function selectVendorForMode(mode) {
    const found = vendorRegistry.find(v => v.supports.includes(mode));
    if (found) {
        return found;
    }
    return vendorRegistry[0]; // default for now
}
