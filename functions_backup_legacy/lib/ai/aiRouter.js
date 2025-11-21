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
exports.aiRouter = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const selector_1 = require("./selector");
// adapters (all vendors hooked here)
const openai = __importStar(require("./adapters/openai"));
const pi = __importStar(require("./adapters/pi"));
const runwayml = __importStar(require("./adapters/runwayml"));
const kaiber = __importStar(require("./adapters/kaiber"));
const pika = __importStar(require("./adapters/pika"));
const luma = __importStar(require("./adapters/luma"));
const synthesia = __importStar(require("./adapters/synthesia"));
const heygen = __importStar(require("./adapters/heygen"));
const deepmotion = __importStar(require("./adapters/deepmotion"));
const elevenlabs = __importStar(require("./adapters/elevenlabs"));
const udio = __importStar(require("./adapters/udio"));
const suno = __importStar(require("./adapters/suno"));
const musicgen = __importStar(require("./adapters/musicgen"));
const runpod = __importStar(require("./adapters/runpod"));
const openweather = __importStar(require("./adapters/openweather"));
const db = admin.firestore();
const VENDOR_MAP = {
    openai, pi,
    runwayml, kaiber, pika, luma, synthesia, heygen, deepmotion,
    elevenlabs, udio, suno, musicgen, runpod,
    openweather
};
exports.aiRouter = (0, https_1.onCall)(async (req) => {
    if (!req.auth)
        throw new Error("Unauthenticated");
    const { uid } = req.auth;
    const { requestType, // "text|image|video|audio|music|sign|document|weather"
    input, // prompt or input URL(s)
    options = {}, // e.g., style, duration, voiceId, language, captions, sign, quality
    targetQuality = 1.0 // 0.7..1.2
     } = req.data || {};
    if (!requestType || !input)
        throw new Error("Missing parameters");
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists)
        throw new Error("User not found");
    const user = userSnap.data();
    const plan = user.plan || "free";
    const wallet = Number(user.wallet_balance ?? 0);
    // choose vendor (profit-aware)
    const sel = await (0, selector_1.selectVendor)({
        requestType,
        plan,
        walletBalance: wallet,
        targetQuality
    });
    const chosen = sel.vendor;
    const adapter = VENDOR_MAP[chosen];
    if (!adapter?.run)
        throw new Error(`Adapter not found for vendor: ${chosen}`);
    // Affordability check
    if (wallet < sel.priceToUser) {
        throw new Error("Insufficient balance. Please top-up or lower quality.");
    }
    // create ai_requests doc
    const reqRef = db.collection("ai_requests").doc();
    const requestId = reqRef.id;
    await reqRef.set({
        uid, type: requestType, input, options,
        vendor_used: chosen,
        cost: sel.estimatedCost,
        price_charged: sel.priceToUser,
        status: "running",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    // assemble payload
    const payload = { input, options, uid, requestId };
    // execute vendor
    const started = Date.now();
    const result = await adapter.run(payload);
    const latency = Date.now() - started;
    // finalize: wallet charge + logs
    await db.runTransaction(async (t) => {
        const u = await t.get(userRef);
        const current = Number(u.data()?.wallet_balance ?? 0);
        if (current < sel.priceToUser) {
            t.update(reqRef, { status: "failed", error: "Insufficient funds at charge time" });
            throw new Error("Insufficient funds during charge.");
        }
        t.update(userRef, { wallet_balance: current - sel.priceToUser });
        t.update(reqRef, {
            status: result.outputUrl ? "success" : "failed",
            output_url: result.outputUrl ?? null,
            meta: result.meta ?? null,
            error: result.error ?? null,
            latency_ms: latency,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        const profitRef = db.collection("profit_tracking").doc();
        t.set(profitRef, {
            uid,
            vendor: chosen,
            revenue: sel.priceToUser,
            cost: sel.estimatedCost,
            profit: Math.max(0, sel.priceToUser - sel.estimatedCost),
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        const vmRef = db.collection("vendor_metrics").doc(chosen);
        t.set(vmRef, {
            vendor_name: chosen,
            last_used: admin.firestore.FieldValue.serverTimestamp(),
            // Use FieldValue for atomic updates
            latency_ms_total: admin.firestore.FieldValue.increment(latency),
            run_count: admin.firestore.FieldValue.increment(1),
            success_count: admin.firestore.FieldValue.increment(result.outputUrl ? 1 : 0),
            fail_count: admin.firestore.FieldValue.increment(result.outputUrl ? 0 : 1)
        }, { merge: true });
    });
    return {
        status: result.outputUrl ? "success" : "failed",
        vendor_used: chosen,
        output_url: result.outputUrl || null,
        request_id: requestId,
        latency_ms: latency
    };
});
//# sourceMappingURL=aiRouter.js.map