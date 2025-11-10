'use strict';
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
exports.seeddemo = exports.buyPlan = exports.onpostcreate = exports.onusercreate = exports.onOrderStatusChange = exports.verifyAndReleaseEscrow = exports.createEscrowOnOrder = exports.redeemReward = exports.onAIInteractionReward = exports.onReferralReward = exports.onProductSaleReward = exports.updateAgentRanks = exports.aggregateDailyRevenue = exports.onWithdrawalApproved = exports.onVoiceUpload = exports.realtimePayoutManager = exports.enforceTransactionUid = exports.walletManager = exports.vendorOptimizer = exports.schedulePublisher = exports.socialPoster = exports.createVoiceClone = exports.callLiveLoop = exports.callSessionHandler = exports.aiRouter = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// --- AI ORCHESTRATION (All remain 1st-Gen exports) ---
var aiRouter_1 = require("./ai/aiRouter");
Object.defineProperty(exports, "aiRouter", { enumerable: true, get: function () { return aiRouter_1.aiRouter; } });
var callSessionHandler_1 = require("./ai/callSessionHandler");
Object.defineProperty(exports, "callSessionHandler", { enumerable: true, get: function () { return callSessionHandler_1.callSessionHandler; } });
var callLiveLoop_1 = require("./ai/callLiveLoop");
Object.defineProperty(exports, "callLiveLoop", { enumerable: true, get: function () { return callLiveLoop_1.callLiveLoop; } });
var createVoiceClone_1 = require("./ai/createVoiceClone");
Object.defineProperty(exports, "createVoiceClone", { enumerable: true, get: function () { return createVoiceClone_1.createVoiceClone; } });
var socialPoster_1 = require("./ai/socialPoster");
Object.defineProperty(exports, "socialPoster", { enumerable: true, get: function () { return socialPoster_1.socialPoster; } });
Object.defineProperty(exports, "schedulePublisher", { enumerable: true, get: function () { return socialPoster_1.schedulePublisher; } });
var vendorOptimizer_1 = require("./ai/vendorOptimizer");
Object.defineProperty(exports, "vendorOptimizer", { enumerable: true, get: function () { return vendorOptimizer_1.vendorOptimizer; } });
var walletManager_1 = require("./ai/walletManager");
Object.defineProperty(exports, "walletManager", { enumerable: true, get: function () { return walletManager_1.walletManager; } });
// --- Support Modules ---
var enforceTransactionUid_1 = require("./enforceTransactionUid");
Object.defineProperty(exports, "enforceTransactionUid", { enumerable: true, get: function () { return enforceTransactionUid_1.enforceTransactionUid; } });
var realtimePayoutManager_1 = require("./realtimePayoutManager");
Object.defineProperty(exports, "realtimePayoutManager", { enumerable: true, get: function () { return realtimePayoutManager_1.realtimePayoutManager; } });
var openvoiceTrigger_1 = require("./openvoiceTrigger");
Object.defineProperty(exports, "onVoiceUpload", { enumerable: true, get: function () { return openvoiceTrigger_1.onVoiceUpload; } });
// ---------------------- PAYOUT CORE ----------------------
async function processPayout(agentId, amount, method, walletNumber, reqId) {
    try {
        const walletRef = db.collection("wallets").doc(agentId);
        const walletSnap = await walletRef.get();
        if (!walletSnap.exists) {
            await db.collection("withdrawalRequests").doc(reqId).update({
                status: "failed", error: "Wallet not found"
            });
            return;
        }
        const wallet = walletSnap.data() || { balanceTZS: 0 };
        if (wallet.balanceTZS < amount) {
            await db.collection("withdrawalRequests").doc(reqId).update({
                status: "failed", error: "Insufficient wallet balance"
            });
            return;
        }
        await db.runTransaction(async (t) => {
            const ref = db.collection("walletTransactions").doc();
            t.update(walletRef, { balanceTZS: admin.firestore.FieldValue.increment(-amount) });
            t.set(ref, {
                txId: ref.id, agentId, amount: -amount, type: "debit",
                method, walletNumber, timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            t.update(db.collection("withdrawalRequests").doc(reqId), {
                status: "paid", paidAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
    }
    catch (err) {
        await db.collection("withdrawalRequests").doc(reqId).update({
            status: "failed", error: err.message
        });
    }
}
// ✅ `withdrawalRequests` → payout trigger (1st Gen)
exports.onWithdrawalApproved = functions.firestore
    .document("withdrawalRequests/{reqId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== "approved" && after.status === "approved") {
        await processPayout(after.agentId, after.amount, after.paymentMethod, after.walletNumber, context.params.reqId);
    }
});
// ✅ Daily Revenue
exports.aggregateDailyRevenue = functions.pubsub
    .schedule("0 0 * * *")
    .onRun(async () => {
    let totalSales = 0, totalCommission = 0, totalPayouts = 0;
    const salesSnap = await db.collection("sales").get();
    const payoutsSnap = await db.collection("withdrawalRequests").get();
    salesSnap.forEach(s => {
        const d = s.data();
        totalSales += d.amount || 0;
        totalCommission += d.amount * (d.type === "product" ? 0.9 : 0.6);
    });
    payoutsSnap.forEach(p => { if (p.data().status === "paid")
        totalPayouts += p.data().amount; });
    await db.collection("revenueReports").doc(new Date().toISOString().split("T")[0]).set({
        totalSales,
        totalCommission,
        totalPlatformFee: totalSales - totalCommission,
        totalPayouts,
        netProfit: totalSales - totalCommission,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
// ✅ Update Agent Ranks
exports.updateAgentRanks = functions.pubsub
    .schedule("0 2 * * *")
    .onRun(async () => {
    const snap = await db.collection("agentStats").get();
    const batch = db.batch();
    snap.forEach(doc => {
        const d = doc.data();
        let rank = "Bronze";
        if (d.totalSales >= 50 && d.totalRevenue >= 800000)
            rank = "Platinum";
        else if (d.totalSales >= 25 && d.totalRevenue >= 300000)
            rank = "Gold";
        else if (d.totalSales >= 10 && d.totalRevenue >= 100000)
            rank = "Silver";
        batch.update(doc.ref, { rank });
    });
    await batch.commit();
});
// -------------------- REWARDS & POINTS --------------------
async function awardPoints(userId, points, reason) {
    const ref = db.collection("akiliPoints").doc(userId);
    await ref.set({
        userId,
        totalPoints: admin.firestore.FieldValue.increment(points),
        lifetimePoints: admin.firestore.FieldValue.increment(points),
        lastEarnedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return db.collection("rewardHistory").add({
        userId, points, reason, type: "earned",
        timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false,
    });
}
// ✅ Product sale reward
exports.onProductSaleReward = functions.firestore
    .document("sales/{saleId}")
    .onCreate(async (snap) => {
    const sale = snap.data();
    if (sale)
        await awardPoints(sale.agentId, Math.floor(sale.amount * 0.01), "Product sale reward");
});
// ✅ Referral reward
exports.onReferralReward = functions.firestore
    .document("referrals/{refId}")
    .onCreate(async (snap) => {
    const ref = snap.data();
    if (ref?.status === "converted")
        await awardPoints(ref.sharedBy, 50, "Referral conversion reward");
});
// ✅ AI session reward
exports.onAIInteractionReward = functions.firestore
    .document("aiSessions/{id}")
    .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.isActive && !after.isActive && after.duration > 60) {
        await awardPoints(after.userId, Math.floor(after.duration / 60) * 10, "AI session engagement");
    }
});
// ✅ Redeem rewards
exports.redeemReward = functions.https.onCall(async (req, ctx) => {
    if (!ctx.auth)
        throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const userId = ctx.auth.uid;
    const { rewardId } = req;
    return db.runTransaction(async (t) => {
        const rewardDoc = await t.get(db.collection("rewardCatalog").doc(rewardId));
        const pointsDoc = await t.get(db.collection("akiliPoints").doc(userId));
        if (!rewardDoc.exists)
            throw new functions.https.HttpsError("not-found", "Reward not found.");
        const reward = rewardDoc.data();
        const points = pointsDoc.data()?.totalPoints || 0;
        if (points < reward.costPoints)
            throw new functions.https.HttpsError("failed-precondition", "Insufficient points.");
        t.update(db.collection("akiliPoints").doc(userId), { totalPoints: admin.firestore.FieldValue.increment(-reward.costPoints) });
        return { success: true, message: `${reward.title} redeemed successfully!` };
    });
});
// ---------------------- ESCROW / VERIFICATION ----------------------
exports.createEscrowOnOrder = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snap, context) => {
    const order = snap.data();
    if (!order)
        return;
    const escrowRef = db.collection("escrow").doc();
    await escrowRef.set({
        orderId: context.params.orderId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        amount: order.amount,
        status: "held",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await snap.ref.update({ escrowId: escrowRef.id, status: "paid" });
});
exports.verifyAndReleaseEscrow = functions.firestore
    .document("deliveryProofs/{id}")
    .onUpdate(async (change) => {
    const after = change.after.data();
    if (!after?.verified)
        return;
    const orderDoc = await db.collection("orders").doc(after.orderId).get();
    if (!orderDoc.exists)
        return;
    await db.collection("escrow").doc(orderDoc.data().escrowId).update({
        status: "released", releasedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection("orders").doc(after.orderId).update({ status: "completed" });
});
// ------------------------- TRUST SCORES -------------------------
exports.onOrderStatusChange = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== after.status) {
        await db.collection("orderTracking").add({
            orderId: change.after.id,
            status: after.status,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});
// ------------------------- USER EVENTS -------------------------
exports.onusercreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, phoneNumber, photoURL } = user;
    await db.collection("users").doc(uid).set({
        uid, email, displayName: displayName || "New User", phone: phoneNumber || null, photoURL: photoURL || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
exports.onpostcreate = functions.firestore
    .document("posts/{postId}")
    .onCreate(async (snap) => {
    const post = snap.data();
    if (post?.authorId)
        await awardPoints(post.authorId, 10, "Created a new post");
});
// ------------------------- PLANS -------------------------
exports.buyPlan = functions.https.onCall(async (data, ctx) => {
    if (!ctx.auth)
        throw new functions.https.HttpsError("unauthenticated", "Login required.");
    await db.collection("users").doc(ctx.auth.uid).update({ plan: data.planId });
    return { success: true };
});
// ------------------------- DEMO -------------------------
exports.seeddemo = functions.https.onCall(async (_, ctx) => {
    if (!ctx.auth)
        throw new functions.https.HttpsError("unauthenticated", "Login required.");
    return { success: true, message: "Demo seeded." };
});
//# sourceMappingURL=index.js.map