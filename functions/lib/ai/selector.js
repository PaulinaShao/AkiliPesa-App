import * as admin from "firebase-admin";
const db = admin.firestore();
/**
 * Vendor pricing + quality assumptions (these can be tuned dynamically)
 * You will update live values via /vendor_metrics and /settings/routingWeights.
 */
const BASE_VENDOR_PROFILES = {
    openai: { costPerUnit: 0.04, quality: 95, latency: 1200, supports: ["text", "voice", "stt", "chat"] },
    pi: { costPerUnit: 0.03, quality: 92, latency: 1000, supports: ["chat", "emotional"] },
    runwayml: { costPerUnit: 0.25, quality: 90, latency: 8000, supports: ["video"] },
    kaiber: { costPerUnit: 0.21, quality: 88, latency: 9000, supports: ["video"] },
    pika: { costPerUnit: 0.19, quality: 87, latency: 9500, supports: ["video"] },
    luma: { costPerUnit: 0.27, quality: 93, latency: 11000, supports: ["video"] },
    synthesia: { costPerUnit: 0.40, quality: 91, latency: 7000, supports: ["video", "avatar"] },
    heygen: { costPerUnit: 0.33, quality: 89, latency: 6500, supports: ["video", "avatar"] },
    deepmotion: { costPerUnit: 0.18, quality: 85, latency: 5000, supports: ["motion", "sign"] },
    elevenlabs: { costPerUnit: 0.03, quality: 96, latency: 1200, supports: ["tts", "voice"] },
    udio: { costPerUnit: 0.12, quality: 86, latency: 7000, supports: ["music"] },
    suno: { costPerUnit: 0.11, quality: 84, latency: 6500, supports: ["music"] },
    musicgen: { costPerUnit: 0.07, quality: 78, latency: 5500, supports: ["music"] },
    runpod: { costPerUnit: 0.09, quality: 88, latency: 6000, supports: ["voice", "gpu", "custom"] },
};
/**
 * Get runtime vendor performance & override data
 * (written daily by vendorOptimizer.ts)
 */
async function loadDynamicVendorMetrics() {
    const snap = await db.collection("vendor_metrics").get();
    const metrics = {};
    snap.forEach((doc) => metrics[doc.id] = doc.data());
    return metrics;
}
/**
 * Get routing weights configured by admin (optional optimization)
 */
async function loadRoutingWeights() {
    const ref = db.collection("settings").doc("routingWeights");
    const doc = await ref.get();
    return doc.exists ? doc.data() : {};
}
/**
 * Core vendor selection logic
 */
export async function selectVendor({ requestType, // "text|video|audio|music|voice|sign|chat"
plan, // "free|starter|pro|vip"
walletBalance, // number (credits or TZS)
targetQuality = 1.0 // 0.7-1.2 range
 }) {
    const metrics = await loadDynamicVendorMetrics();
    const routingWeights = await loadRoutingWeights();
    let candidates = Object.entries(BASE_VENDOR_PROFILES)
        .filter(([_, v]) => v.supports.includes(requestType))
        .map(([name, base]) => {
        const m = metrics[name] || {};
        const w = routingWeights[name] || 1.0;
        const quality = (base.quality + (m.qualityBoost || 0)) * w;
        const latency = m.latencyMs || base.latency;
        const cost = (m.costPerUnit || base.costPerUnit);
        return { name, cost, quality, latency };
    });
    // Sort by quality/latency balance
    candidates.sort((a, b) => (b.quality - a.quality) - (a.latency - b.latency));
    // Adjust for plan restrictions
    if (plan === "free")
        candidates = candidates.slice(-3); // cheaper vendors
    if (plan === "starter")
        candidates = candidates.slice(-5); // balanced
    // pro & vip get full vendor set
    // Filter for wallet affordability
    const affordable = candidates.filter(c => walletBalance >= c.cost);
    const selected = affordable.length > 0 ? affordable[0] : candidates[candidates.length - 1];
    const estimatedCost = selected.cost;
    const platformMargin = plan === "vip" ? 1.7 : plan === "pro" ? 1.5 : 1.25;
    const priceToUser = estimatedCost * platformMargin;
    return {
        vendor: selected.name,
        estimatedCost,
        priceToUser,
        expectedLatency: selected.latency,
        expectedQuality: selected.quality,
    };
}
//# sourceMappingURL=selector.js.map