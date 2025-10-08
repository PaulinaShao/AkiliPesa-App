
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Trigger when user signs up
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const profile = {
    uid: user.uid,
    phone: user.phoneNumber || null,
    email: user.email || null,
    handle: user.email?.split("@")[0] || `user_${user.uid.substring(0,5)}`,
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

// Trigger when post created
export const onPostCreate = functions.firestore
  .document("posts/{postId}")
  .onCreate(async (snap, context) => {
    const post = snap.data();
    if (post?.authorId) {
      await admin.firestore().collection("users").doc(post.authorId).update({
        "stats.postsCount": admin.firestore.FieldValue.increment(1),
      });
    }
  });

// Trigger when order updated
export const onOrderUpdate = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    // Check if the status has changed to "paid"
    if (before.status !== "paid" && after.status === "paid") {
      const orderId = context.params.orderId;
      const order = after;
      
      const productDoc = await admin.firestore().collection("products").doc(order.productId).get();
      const product = productDoc.data();
      const isService = product?.type === "service";

      const platformFee = isService ? order.amount * 0.40 : order.amount * 0.20; // 40% for service, 20% for others
      const commissionFee = order.amount * 0.10; // 10% commission
      const taxes = order.amount * 0.05; // 5% example tax
      const transferFee = 500; // Fixed transfer fee example

      const ownerShare = order.amount - (platformFee + commissionFee + taxes + transferFee);
      const akilipesaShare = platformFee;
      const commissionShare = commissionFee;
      
      const netPayout = ownerShare;

      // Create initial payment record
      await admin.firestore().collection("payments").doc(orderId).set({
        id: orderId,
        orderId: orderId,
        sellerId: order.sellerId,
        amountGross: order.amount,
        fees: {
          platform: platformFee,
          commission: commissionFee,
          taxes: taxes,
          transferFee: transferFee
        },
        amountNet: netPayout,
        breakdown: {
            ownerShare: ownerShare,
            akilipesaShare: akilipesaShare,
            commissionShare: commissionShare
        },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
