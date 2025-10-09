// Triggering a re-deploy at user's request.
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
admin.initializeApp();
const db = admin.firestore();
const region = "us-central1";
/** Utility: commission + revenue share math (service vs product) */
function computePayout(input) {
    const gross = input.gross;
    const tax = gross * input.taxRate;
    const commission = gross * (input.commissionRate ?? 0.10);
    const platformShare = input.type === "service" ? gross * 0.40 : 0; // default service platform share
    const ownerShareBase = input.type === "service" ? gross * 0.50 : 0;
    // transfer fee placeholder (e.g., 1.5%)
    const transferFee = gross * 0.015;
    const netForOwner = input.type === "service"
        ? ownerShareBase - tax - commission - transferFee
        : gross - tax - commission - transferFee;
    const akiliPesaShare = input.type === "service" ? platformShare + commission : commission;
    return {
        amountGross: gross,
        taxes: Math.max(0, Math.round(tax)),
        commission: Math.max(0, Math.round(commission)),
        platformShare: Math.max(0, Math.round(akiliPesaShare)),
        transferFee: Math.max(0, Math.round(transferFee)),
        amountNet: Math.max(0, Math.round(netForOwner)),
    };
}
/** Auth → create user profile */
export const onUserCreate = functions.region(region).auth.user()
    .onCreate(async (user) => {
    const profile = {
        uid: user.uid,
        phone: user.phoneNumber ?? null,
        email: user.email ?? null,
        handle: user.email?.split("@")[0] || `user_${user.uid.slice(0, 6)}`,
        displayName: user.displayName || "New User",
        photoURL: user.photoURL || "",
        plan: "free",
        walletBalance: 0,
        stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("users").doc(user.uid).set(profile, { merge: true });
});
/** Posts → increment postsCount */
export const onPostCreate = functions.region(region).firestore
    .document("posts/{postId}")
    .onCreate(async (snap) => {
    const post = snap.data();
    if (!post?.authorId)
        return;
    await db.doc(`users/${post.authorId}`).update({
        "stats.postsCount": admin.firestore.FieldValue.increment(1)
    });
});
/** Orders → when status becomes 'paid' create Payment and update product metrics */
export const onOrderUpdate = functions.region(region).firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, ctx) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === "paid" || after.status !== "paid")
        return;
    const productSnap = await db.doc(`products/${after.productId}`).get();
    const product = productSnap.data();
    const type = product?.kind === "service" ? "service" : "product";
    const payout = computePayout({
        gross: after.amount,
        type,
        taxRate: product?.taxRate ?? 0.0
    });
    const paymentRef = db.collection("payments").doc();
    await paymentRef.set({
        id: paymentRef.id,
        orderId: change.after.id,
        sellerId: after.sellerId,
        amountGross: payout.amountGross,
        fees: {
            platform: payout.platformShare,
            taxes: payout.taxes,
            transfer: payout.transferFee
        },
        amountNet: payout.amountNet,
        status: "completed",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // basic product metrics
    await db.doc(`products/${after.productId}`).set({
        metrics: {
            revenue: admin.firestore.FieldValue.increment(after.amount),
            unitsSold: admin.firestore.FieldValue.increment(after.quantity)
        }
    }, { merge: true });
});
/** One-time seed function (callable) */
export const seedDemo = functions.region(region).https.onCall(async (_data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Sign in");
    const uid = context.auth.uid;
    // minimal profile (if missing)
    await db.doc(`users/${uid}`).set({
        uid, handle: `demo_${uid.slice(0, 5)}`, displayName: "Demo User",
        plan: "trial", walletBalance: 20000,
        stats: { following: 10, followers: 2100000, likes: 15300000, postsCount: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    // sample post
    const p = db.collection("posts").doc();
    await p.set({
        id: p.id, authorId: uid,
        media: { url: "https://picsum.photos/600/800", type: "image" },
        caption: "Chasing waterfalls!",
        tags: ["nature", "travel"], createdAt: admin.firestore.FieldValue.serverTimestamp(),
        likes: 15000, comments: 520, shares: 320, visibility: "public"
    });
    // sample product (service kind)
    const prod = db.collection("products").doc();
    await prod.set({
        id: prod.id, ownerId: uid, kind: "service",
        title: "Content Strategy Session", description: "30-min video call",
        media: "https://picsum.photos/seed/akili/640/360",
        price: 5000, currency: "TZS", taxRate: 0.00, inventory: 999,
        assignedAgentIds: [], metrics: { views: 0, shares: 0, unitsSold: 0, revenue: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // create paid order → triggers payment
    const order = db.collection("orders").doc();
    await order.set({
        id: order.id, productId: prod.id, buyerId: "demoBuyer", sellerId: uid,
        quantity: 1, amount: 5000, currency: "TZS",
        status: "paid", escrow: { held: false },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true };
});
