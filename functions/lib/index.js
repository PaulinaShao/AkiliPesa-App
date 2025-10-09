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
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Trigger when a new user signs up
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const profile = {
        uid: user.uid,
        phone: user.phoneNumber || null,
        email: user.email || null,
        handle: user.email?.split("@")[0] || `user_${user.uid.substring(0, 5)}`,
        displayName: user.displayName || "New User",
        bio: "",
        photoURL: user.photoURL || "",
        plan: "free",
        walletBalance: 0,
        stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore().collection("users").doc(user.uid).set(profile);
});
// Trigger when a post is created
exports.onPostCreate = functions.firestore
    .document("posts/{postId}")
    .onCreate(async (snap, context) => {
    const post = snap.data();
    if (post?.authorId) {
        await admin.firestore().collection("users").doc(post.authorId).update({
            "stats.postsCount": admin.firestore.FieldValue.increment(1),
        });
    }
});
// Trigger when an order is updated
exports.onOrderUpdate = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {
    const after = change.after.data();
    if (after?.status === "paid") {
        // Example: update product metrics & create payment record
        const productRef = admin.firestore().collection("products").doc(after.productId);
        await productRef.update({
            "metrics.unitsSold": admin.firestore.FieldValue.increment(after.quantity),
            "metrics.revenue": admin.firestore.FieldValue.increment(after.amount),
        });
        await admin.firestore().collection("payments").add({
            orderId: context.params.orderId,
            sellerId: after.sellerId,
            amountGross: after.amount,
            fees: { platform: after.amount * 0.1, taxes: after.amount * 0.05 },
            amountNet: after.amount * 0.85,
            status: "completed",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
// Seed demo data
exports.seedDemo = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be called while authenticated.");
    }
    const uid = context.auth.uid;
    await admin.firestore().collection("users").doc(uid).set({
        uid,
        displayName: "Demo User",
        handle: "demo",
        bio: "Seeded demo profile",
        walletBalance: 100,
        stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
});
