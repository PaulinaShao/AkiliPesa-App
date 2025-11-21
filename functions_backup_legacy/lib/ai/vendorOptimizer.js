"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickImageVendor = pickImageVendor;
exports.pickVideoVendor = pickVideoVendor;
function pickImageVendor(plan, wallet) {
    // Cheap fallback if low balance
    if (wallet < 0.1)
        return { vendor: "stability", size: "512x512" };
    // VIP → OpenAI 1024
    if (plan === "vip")
        return { vendor: "openai", size: "1024x1024" };
    // Pro default → OpenAI 512
    if (plan === "pro")
        return { vendor: "openai", size: "512x512" };
    // Free → Stability
    return { vendor: "stability", size: "512x512" };
}
function pickVideoVendor(plan, wallet) {
    if (plan === "vip" && wallet >= 1)
        return { vendor: "luma" };
    return { vendor: "runway" }; // default
}
//# sourceMappingURL=vendorOptimizer.js.map