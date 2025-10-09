
import * as functions from "firebase-functions/v2";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as admin from "firebase-admin";

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });


export const onUserCreate = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  await admin.firestore().collection("users").doc(user.uid).set({
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
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

export const onPostCreate = functions.firestore.document("posts/{postId}").onCreate(async (snap: functions.firestore.QueryDocumentSnapshot) => {
  const post = snap.data();
  if (!post?.authorId) return;
  await admin.firestore().collection("users").doc(post.authorId).update({
    "stats.postsCount": admin.firestore.FieldValue.increment(1),
  });
});

export const onOrderUpdate = functions.firestore.document("orders/{orderId}").onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>) => {
    const before = change.before.data();
    const after = change.after.data();

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

export const seedDemo = functions.https.onCall(async (_data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const uid = context.auth.uid;

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
