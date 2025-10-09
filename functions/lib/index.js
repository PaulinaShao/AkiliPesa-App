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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemo = exports.onOrderUpdate = exports.onPostCreate = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const options_1 = require("firebase-functions/v2/options");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
(0, options_1.setGlobalOptions)({ region: "us-central1" });
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    await admin.firestore().collection("users").doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        phone: user.phoneNumber,
        handle: user.email?.split("@")[0] || `user_${user.uid.slice(0, 6)}`,
        displayName: user.displayName || "New User",
        photoURL: user.photoURL || "",
        plan: "free",
        walletBalance: 0,
        stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
exports.onPostCreate = functions.firestore.document("posts/{postId}").onCreate(async (snap) => {
    const post = snap.data();
    if (!post?.authorId)
        return;
    await admin.firestore().collection("users").doc(post.authorId).update({
        "stats.postsCount": admin.firestore.FieldValue.increment(1),
    });
});
exports.onOrderUpdate = functions.firestore.document("orders/{orderId}").onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after || before.status === "paid" || after.status !== "paid") {
        return;
    }
    const productSnap = await admin.firestore().doc(`products/${after.productId}`).get();
    const product = productSnap.data();
    const type = product?.kind === "service" ? "service" : "product";
    const gross = after.amount;
    const tax = gross * (product?.taxRate ?? 0.0);
    const commission = gross * 0.10;
    const platformShare = type === "service" ? gross * 0.40 : 0;
    const ownerShareBase = type === "service" ? gross * 0.50 : 0;
    const transferFee = gross * 0.015;
    const netForOwner = type === "service"
        ? ownerShareBase - tax - commission - transferFee
        : gross - tax - commission - transferFee;
    const akiliPesaShare = type === "service" ? platformShare + commission : commission;
    const paymentRef = admin.firestore().collection("payments").doc();
    await paymentRef.set({
        id: paymentRef.id,
        orderId: change.after.id,
        sellerId: after.sellerId,
        amountGross: gross,
        fees: {
            platform: Math.max(0, Math.round(akiliPesaShare)),
            taxes: Math.max(0, Math.round(tax)),
            transfer: Math.max(0, Math.round(transferFee))
        },
        amountNet: Math.max(0, Math.round(netForOwner)),
        status: "completed",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await admin.firestore().doc(`products/${after.productId}`).set({
        metrics: {
            revenue: admin.firestore.FieldValue.increment(after.amount),
            unitsSold: admin.firestore.FieldValue.increment(after.quantity)
        }
    }, { merge: true });
});
exports.seedDemo = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const uid = context.auth.uid;
    await admin.firestore().doc(`users/${uid}`).set({
        uid, handle: `demo_${uid.slice(0, 5)}`, displayName: "Demo User",
        plan: "trial", walletBalance: 20000,
        stats: { following: 10, followers: 2100000, likes: 15300000, postsCount: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    const p = admin.firestore().collection("posts").doc();
    await p.set({
        id: p.id, authorId: uid,
        media: { url: "https://picsum.photos/600/800", type: "image" },
        caption: "Chasing waterfalls!",
        tags: ["nature", "travel"], createdAt: admin.firestore.FieldValue.serverTimestamp(),
        likes: 15000, comments: 520, shares: 320, visibility: "public"
    });
    const prod = admin.firestore().collection("products").doc();
    await prod.set({
        id: prod.id, ownerId: uid, kind: "service",
        title: "Content Strategy Session", description: "30-min video call",
        media: "https://picsum.photos/seed/akili/640/360",
        price: 5000, currency: "TZS", taxRate: 0.00, inventory: 999,
        assignedAgentIds: [], metrics: { views: 0, shares: 0, unitsSold: 0, revenue: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const order = admin.firestore().collection("orders").doc();
    await order.set({
        id: order.id, productId: prod.id, buyerId: "demoBuyer", sellerId: uid,
        quantity: 1, amount: 5000, currency: "TZS",
        status: "paid", escrow: { held: false },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true };
});
