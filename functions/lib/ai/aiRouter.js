import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { selectVendor } from "./selector";
// adapters (all vendors hooked here)
import * as openai from "./adapters/openai";
import * as pi from "./adapters/pi";
import * as runwayml from "./adapters/runwayml";
import * as kaiber from "./adapters/kaiber";
import * as pika from "./adapters/pika";
import * as luma from "./adapters/luma";
import * as synthesia from "./adapters/synthesia";
import * as heygen from "./adapters/heygen";
import * as deepmotion from "./adapters/deepmotion";
import * as elevenlabs from "./adapters/elevenlabs";
import * as udio from "./adapters/udio";
import * as suno from "./adapters/suno";
import * as musicgen from "./adapters/musicgen";
import * as runpod from "./adapters/runpod";
import * as openweather from "./adapters/openweather";
const db = admin.firestore();
const VENDOR_MAP = {
    openai, pi,
    runwayml, kaiber, pika, luma, synthesia, heygen, deepmotion,
    elevenlabs, udio, suno, musicgen, runpod,
    openweather
};
export const aiRouter = onCall(async (req) => {
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
    const sel = await selectVendor({
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