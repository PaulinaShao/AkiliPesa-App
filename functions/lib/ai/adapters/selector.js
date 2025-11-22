import { openAiVendor } from "./openai.js";
export const vendorRegistry = [
    openAiVendor
    // Later, you can add other vendors here:
    // runpodVendor,
    // udioVendor,
];
export function selectVendorForMode(mode, preferred) {
    // 1. Try to find the preferred vendor if specified
    if (preferred) {
        const found = vendorRegistry.find((v) => v.name === preferred);
        if (found && found.supports.includes(mode))
            return found;
    }
    // 2. Find the first vendor that supports the mode
    const fallback = vendorRegistry.find((v) => v.supports.includes(mode));
    if (!fallback) {
        throw new Error(`No vendor supports mode: ${mode}`);
    }
    return fallback;
}
