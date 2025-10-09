import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated, Change, DocumentSnapshot } from "firebase-functions/v2/firestore";
import { onUserCreated, UserRecord } from "firebase-functions/v2/auth";

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });


export const onUserCreate = onUserCreated(async (event: { data: UserRecord }) => {
  const user = event.data;
  const profile = {
    uid: user.uid,
    email: user.email,
    phone: user.phoneNumber,
    handle: user.email?.split("@")[0] || `user_${user.uid.slice(0,6)}`,
    displayName: user.displayName || "New User",
    photoURL: user.photoURL || "",
    plan: "free",
    walletBalance: 0,
    stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await admin.firestore().collection("users").doc(user.uid).set(profile, { merge: true });
});

export const onPostCreate = onDocumentCreated("posts/{postId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const post = snap.data();
  if (!post?.authorId) return;
  await admin.firestore().doc(`users/${post.authorId}`).update({
    "stats.postsCount": admin.firestore.FieldValue.increment(1)
  });
});

export const onOrderUpdate = onDocumentUpdated("orders/{orderId}", async (event) => {
  const after = event.data?.after.data();
  const before = event.data?.before.data();

  if (!before || !after || before.status === "paid" || after.status !== "paid") {
    return;
  }

  const productSnap = await admin.firestore().doc(`products/${after.productId}`).get();
  const product = productSnap.data();
  const type: "product"|"service" = product?.kind === "service" ? "service" : "product";

  const gross = after.amount;
  const tax = gross * (product?.taxRate ?? 0.0);
  const commission = gross * 0.10;
  const platformShare = type === "service" ? gross * 0.40 : 0;
  const ownerShareBase = type === "service" ? gross * 0.50 : 0;
  const transferFee = gross * 0.015;

  const netForOwner =
    type === "service"
      ? ownerShareBase - tax - commission - transferFee
      : gross - tax - commission - transferFee;

  const akiliPesaShare =
    type === "service" ? platformShare + commission : commission;

  const paymentRef = admin.firestore().collection("payments").doc();
  await paymentRef.set({
    id: paymentRef.id,
    orderId: event.data?.after.id,
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

export const seedDemo = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const uid = request.auth.uid;

  await admin.firestore().doc(`users/${uid}`).set({
    uid, handle: `demo_${uid.slice(0,5)}`, displayName: "Demo User",
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
    tags: ["nature","travel"], createdAt: admin.firestore.FieldValue.serverTimestamp(),
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