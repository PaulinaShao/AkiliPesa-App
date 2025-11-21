"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectVendor = selectVendor;
exports.estimateCost = estimateCost;
exports.computeUserPrice = computeUserPrice;
exports.callVendor = callVendor;
const openai = __importStar(require("./openai"));
const pi = __importStar(require("./pi"));
const runwayml = __importStar(require("./runwayml"));
const kaiber = __importStar(require("./kaiber"));
const deepmotion = __importStar(require("./deepmotion"));
const synthesia = __importStar(require("./synthesia"));
const udio = __importStar(require("./udio"));
const suno = __importStar(require("./suno"));
const musicgen = __importStar(require("./musicgen"));
const elevenlabs = __importStar(require("./elevenlabs"));
const runpod = __importStar(require("./runpod"));
const heygen = __importStar(require("./heygen"));
const pika = __importStar(require("./pika"));
const luma = __importStar(require("./luma"));
const rephrase = __importStar(require("./rephrase"));
const VENDORS = {
    openai: { name: "openai", run: openai.run, baseCost: 0.04, supported: ["text", "audio", "image"] },
    pi: { name: "pi", run: pi.run, baseCost: 0.03, supported: ["text"] },
    runwayml: { name: "runwayml", run: runwayml.run, baseCost: 0.08, supported: ["video", "image"] },
    kaiber: { name: "kaiber", run: kaiber.run, baseCost: 0.03, supported: ["video", "image"] },
    deepmotion: { name: "deepmotion", run: deepmotion.run, baseCost: 0.07, supported: ["video", "sign"] },
    synthesia: { name: "synthesia", run: synthesia.run, baseCost: 0.12, supported: ["video"] },
    udio: { name: "udio", run: udio.run, baseCost: 0.05, supported: ["audio"] },
    suno: { name: "suno", run: suno.run, baseCost: 0.05, supported: ["audio"] },
    musicgen: { name: "musicgen", run: musicgen.run, baseCost: 0.02, supported: ["audio"] },
    elevenlabs: { name: "elevenlabs", run: elevenlabs.run, baseCost: 0.05, supported: ["audio"] },
    runpod: { name: "runpod", run: runpod.run, baseCost: 0.02, supported: ["audio", "image", "video", "text"] },
    heygen: { name: "heygen", run: heygen.run, baseCost: 0.08, supported: ["video"] },
    pika: { name: "pika", run: pika.run, baseCost: 0.06, supported: ["video"] },
    luma: { name: "luma", run: luma.run, baseCost: 0.10, supported: ["video"] },
    rephrase: { name: "rephrase", run: rephrase.run, baseCost: 0.09, supported: ["video"] },
};
const PLAN_LIMITS = {
    free: { maxCost: 0.50, pref: ["openai", "musicgen", "kaiber"] },
    starter: { maxCost: 2.00, pref: ["openai", "kaiber", "runwayml", "runpod", "udio", "suno"] },
    pro: { maxCost: 5.00, pref: ["openai", "runwayml", "deepmotion", "elevenlabs", "runpod", "pika"] },
    vip: { maxCost: 10.0, pref: ["openai", "synthesia", "runwayml", "deepmotion", "elevenlabs", "heygen", "luma", "rephrase", "runpod"] },
};
function selectVendor(params) {
    const plan = PLAN_LIMITS[params.plan] ? params.plan : "free";
    const pref = PLAN_LIMITS[plan].pref;
    // filter vendors by capability and plan cost ceiling
    const candidates = pref
        .map(name => VENDORS[name])
        .filter(v => v.supported.includes(params.requestType));
    // naive pick: lowest baseCost under maxCost
    const maxCost = PLAN_LIMITS[plan].maxCost;
    const picked = candidates
        .filter(v => v.baseCost <= maxCost)
        .sort((a, b) => a.baseCost - b.baseCost)[0] || candidates[0];
    return picked || VENDORS.openai;
}
function estimateCost(v, _requestType, _options) {
    // For now use baseCost; Studio can later expand with duration/length multipliers
    return v.baseCost;
}
function computeUserPrice(cost, plan) {
    // margin bands
    const minMargin = 0.30;
    const maxMargin = 0.60;
    const margin = plan === "vip" ? 0.60 : plan === "pro" ? 0.50 : plan === "starter" ? 0.40 : 0.30;
    const clamped = Math.min(Math.max(margin, minMargin), maxMargin);
    return +(cost * (1 + clamped)).toFixed(2);
}
async function callVendor(vendor, payload) {
    try {
        return await vendor.run(payload);
    }
    catch (e) {
        return { outputUrl: null, error: e?.message || "vendor_error" };
    }
}
//# sourceMappingURL=selector.js.map