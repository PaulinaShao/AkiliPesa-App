import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/** -------------------------------
 *  INTERNAL HELPERS (unchanged)
 *  ------------------------------- */
async function processPayout(
  agentId: string,
  amount: number,
  method: string,
  walletNumber: string,
  reqId: string
) {
  try {
    const walletRef = db.collection("wallets").doc(agentId);
    const walletSnap = await walletRef.get();

    if (!walletSnap.exists) {
      console.warn(`⚠️ Wallet not found for agent ${agentId}`);
      await db.collection("withdrawalRequests").doc(reqId).update({
        status: "failed",
        error: "Wallet not found",
      });
      return;
    }

    const wallet = walletSnap.data() || { balanceTZS: 0 };
    if (wallet.balanceTZS < amount) {
      console.warn(`⚠️ Insufficient balance for agent ${agentId}`);
      await db.collection("withdrawalRequests").doc(reqId).update({
        status: "failed",
        error: "Insufficient wallet balance",
      });
      return;
    }

    await db.runTransaction(async (t) => {
      const ref = db.collection("walletTransactions").doc();
      t.update(walletRef, {
        balanceTZS: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      t.set(ref, {
        txId: ref.id,
        agentId,
        amount: -amount,
        type: "debit",
        method,
        walletNumber,
        description: `Withdrawal payout via ${method}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      t.update(db.collection("withdrawalRequests").doc(reqId), {
        status: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    console.log(`✅ Payout processed internally for ${reqId} (Agent: ${agentId})`);
  } catch (err) {
    console.error(`❌ Error processing payout for ${reqId}:`, err);
    await db.collection("withdrawalRequests").doc(reqId).update({
      status: "failed",
      error: (err as Error).message,
    });
  }
}

async function awardPoints(userId: string, points: number, reason: string) {
  if (!userId || !points || points <= 0) return;
  const ref = db.collection("akiliPoints").doc(userId);
  await ref.set(
    {
      userId,
      totalPoints: admin.firestore.FieldValue.increment(points),
      lifetimePoints: admin.firestore.FieldValue.increment(points),
      lastEarnedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return db.collection("rewardHistory").add({
    userId,
    points,
    reason,
    type: "earned",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    isRead: false,
  });
}

async function verifyMediaWithAI(imageUrl: string, type: string) {
  try {
    console.log(`Verifying ${type} media: ${imageUrl}`);
    const isSuspicious = imageUrl.includes("suspicious") || Math.random() < 0.1;
    if (isSuspicious) {
      return {
        verified: false,
        flags: ["ai_flag_suspicious_content"],
        confidence: 0.45,
        aiVendor: "Simulated_AI_Vision",
      };
    }
    return {
      verified: true,
      flags: [],
      confidence: 0.97,
      aiVendor: "Simulated_AI_Vision",
    };
  } catch (err) {
    console.error("AI verification error:", err);
    return {
      verified: false,
      flags: ["ai_check_failed"],
      confidence: 0.1,
      aiVendor: "Simulated_AI_Vision",
    };
  }
}

async function updateTrustScore(sellerId: string) {
  if (!sellerId) return;

  const productsSnap = await db
    .collection("productVerification")
    .where("sellerId", "==", sellerId)
    .get();
  const verified = productsSnap.docs.filter(
    (d) => d.data().status === "verified"
  ).length;
  const flagged = productsSnap.docs.filter(
    (d) => d.data().status === "flagged"
  ).length;

  const ordersSnap = await db
    .collection("orders")
    .where("sellerId", "==", sellerId)
    .get();
  const onTime = ordersSnap.docs.filter(
    (d) => d.data().status === "completed"
  ).length;
  const late = ordersSnap.docs.filter(
    (d) => d.data().status === "late" || d.data().status === "refund_requested"
  ).length;

  const feedbacksSnap = await db
    .collection("feedback")
    .where("sellerId", "==", sellerId)
    .get();
  const pos = feedbacksSnap.docs.filter(
    (d) => d.data().sentiment === "positive"
  ).length;
  const neg = feedbacksSnap.docs.filter(
    (d) => d.data().sentiment === "negative"
  ).length;

  const baseScore = 70;
  const score = Math.max(
    0,
    Math.min(
      100,
      baseScore +
        verified * 0.2 -
        flagged * 5 +
        onTime * 0.5 -
        late * 2 +
        pos * 0.3 -
        neg * 3
    )
  );
  const level =
    score >= 90 ? "Platinum" : score >= 80 ? "Gold" : score >= 60 ? "Silver" : "Bronze";

  const scoreData = {
    sellerId,
    trustScore: score,
    level,
    metrics: {
      verifiedListings: verified,
      flaggedListings: flagged,
      onTimeDeliveries: onTime,
      lateDeliveries: late,
      feedbackPositive: pos,
      feedbackNegative: neg,
    },
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("trustScores").doc(sellerId).set(scoreData, { merge: true });
  await db.collection("trustHistory").add({
    sellerId,
    trustScore: score,
    level,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Updated trust score for seller ${sellerId} to ${score} (${level})`);
}

async function analyzeBehavior(buyerId: string) {
  if (!buyerId) return;

  const ordersSnap = await db
    .collection("orders")
    .where("buyerId", "==", buyerId)
    .get();
  const onTime = ordersSnap.docs.filter(
    (d) => d.data().status === "completed"
  ).length;
  const late = ordersSnap.docs.filter((d) => d.data().status === "late").length;
  const refunds = ordersSnap.docs.filter(
    (d) => d.data().status === "refund_requested" || d.data().status === "refunded"
  ).length;

  const feedbacksSnap = await db
    .collection("feedback")
    .where("buyerId", "==", buyerId)
    .get();
  const pos = feedbacksSnap.docs.filter(
    (d) => d.data().sentiment === "positive"
  ).length;
  const neg = feedbacksSnap.docs.filter(
    (d) => d.data().sentiment === "negative"
  ).length;

  const baseScore = 70;
  const score = Math.max(
    0,
    Math.min(
      100,
      baseScore + onTime * 0.3 - late * 3 - refunds * 5 + pos * 0.5 - neg * 3
    )
  );
  const level =
    score >= 90 ? "Platinum" : score >= 80 ? "Gold" : score >= 60 ? "Silver" : "Bronze";

  const scoreData = {
    buyerId,
    trustScore: score,
    level,
    metrics: {
      onTimePayments: onTime,
      latePayments: late,
      refundsRequested: refunds,
      positiveFeedback: pos,
      negativeFeedback: neg,
    },
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("buyerTrust").doc(buyerId).set(scoreData, { merge: true });
  await db.collection("buyerHistory").add({
    buyerId,
    trustScore: score,
    level,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Updated buyer trust score for ${buyerId} to ${score} (${level})`);
}

/** -------------------------------
 *  aggregateDailyRevenue
 *  ------------------------------- */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

export const aggregateDailyRevenue = onSchedule("0 0 * * *", async (event) => {
  logger.log("Running daily revenue aggregation...");

  const salesSnap = await db.collection("sales").get();
  const payoutsSnap = await db.collection("withdrawalRequests").get();

  let totalSales = 0,
    totalCommission = 0,
    totalPayouts = 0;

  salesSnap.forEach((doc) => {
    const s = doc.data();
    totalSales += s.amount || 0;
    totalCommission += s.amount * (s.type === "product" ? 0.9 : 0.6);
  });

  payoutsSnap.forEach((p) => {
    if (p.data().status === "paid") totalPayouts += p.data().amount;
  });

  await db.collection("revenueReports")
    .doc(new Date().toISOString().split("T")[0])
    .set({
      totalSales,
      totalCommission,
      totalPlatformFee: totalSales - totalCommission,
      totalPayouts,
      netProfit: totalSales - totalCommission,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  console.log("✅ Daily revenue report generated.");
});




/** -------------------------------
 *  updateAgentRanks v2
 *  ------------------------------- */

export const updateAgentRanks = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "Africa/Dar_es_Salaam",
  },
  async () => {
    logger.log("🏅 Updating agent ranks...");

    const snap = await db.collection("agentStats").get();
    const batch = db.batch();

    snap.forEach((doc) => {
      const d = doc.data();
      let rank = "Bronze";
      if (d.totalSales >= 50 && d.totalRevenue >= 800000) rank = "Platinum";
      else if (d.totalSales >= 25 && d.totalRevenue >= 300000) rank = "Gold";
      else if (d.totalSales >= 10 && d.totalRevenue >= 100000) rank = "Silver";
      if (d.rank !== rank) batch.update(doc.ref, { rank });
    });

    await batch.commit();
    logger.log(`✅ Agent ranks updated for ${snap.size} agents.`);
  }
);


/** -------------------------------
 *  GEN1 FIRESTORE TRIGGERS (v1)
 *  ------------------------------- */
export const onWithdrawalApproved = functions.firestore
  .document("withdrawalRequests/{reqId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return;

    if (before.status !== "approved" && after.status === "approved") {
      const payload = {
        requestId: context.params.reqId,
        agentId: after.agentId,
        amount: after.amount,
        paymentMethod: after.paymentMethod,
        walletNumber: after.walletNumber,
      };

      console.log(`Triggering internal payout for ${payload.requestId}`);
      await processPayout(
        payload.agentId,
        payload.amount,
        payload.paymentMethod,
        payload.walletNumber,
        payload.requestId
      );
    }
  });

export const onProductSaleReward = functions.firestore
  .document("sales/{saleId}")
  .onCreate(async (snap) => {
    const sale = snap.data();
    if (!sale) return;
    const points = Math.floor((sale.amount || 0) * 0.01);
    if (points > 0) await awardPoints(sale.agentId, points, "Product sale reward");
  });

export const onReferralReward = functions.firestore
  .document("referrals/{refId}")
  .onCreate(async (snap) => {
    const ref = snap.data();
    if (ref && ref.status === "converted") {
      await awardPoints(ref.sharedBy, 50, "Referral conversion reward");
    }
  });

export const onAIInteractionReward = functions.firestore
  .document("aiSessions/{id}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return;
    if (before.isActive && !after.isActive && after.duration && after.duration > 60) {
      const points = Math.floor(after.duration / 60) * 10;
      if (after.userId) await awardPoints(after.userId, points, "AI session engagement");
    }
  });

export const createEscrowOnOrder = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    if (!order) return;
    const escrowRef = db.collection("escrow").doc();
    await escrowRef.set({
      orderId: context.params.orderId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amount: order.amount,
      status: "held",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await db
      .collection("orders")
      .doc(context.params.orderId)
      .update({ escrowId: escrowRef.id, status: "paid" });
  });

export const verifyAndReleaseEscrow = functions.firestore
  .document("deliveryProofs/{id}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return;

    if (before.verified === true || after.verified !== true) return;

    const orderDoc = await db.collection("orders").doc(after.orderId).get();
    if (!orderDoc.exists) return;
    const order = orderDoc.data()!;

    const verificationDoc = await db
      .collection("productVerification")
      .doc(order.productId)
      .get();
    const verification = verificationDoc.data();
    if (verification && verification.status !== "verified") {
      console.log(
        `⚠️ Product ${order.productId} not verified, skipping escrow release for order ${after.orderId}`
      );
      await db.collection("escrow").doc(order.escrowId).update({ status: "hold_for_review" });
      return;
    }

    if (after.verified === true) {
      await db.collection("escrow").doc(order.escrowId).update({
        status: "released",
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        verified: true,
      });
      await db.collection("orders").doc(after.orderId).update({ status: "completed" });
    }
  });

export const onProductCreatedVerify = functions.firestore
  .document("products/{productId}")
  .onCreate(async (snap, context) => {
    const product = snap.data();
    if (!product || !product.media) return;

    const result = await verifyMediaWithAI(product.media, "product");
    await db
      .collection("productVerification")
      .doc(context.params.productId)
      .set({
        productId: context.params.productId,
        sellerId: product.ownerId,
        status: result.verified ? "verified" : "flagged",
        confidenceScore: result.confidence,
        flags: result.flags,
        aiVendor: result.aiVendor,
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    if (product.ownerId) {
      await updateTrustScore(product.ownerId);
    }
  });

export const onDeliveryProofAdded = functions.firestore
  .document("deliveryProofs/{id}")
  .onCreate(async (snap, context) => {
    const proof = snap.data();
    if (!proof || !proof.url) return;

    const result = await verifyMediaWithAI(proof.url, "delivery");
    await db
      .collection("deliveryProofs")
      .doc(context.params.id)
      .update({
        verified: result.verified,
        verificationFlags: result.flags,
      });

    if (!result.verified) {
      await db.collection("mediaReports").add({
        fileId: context.params.id,
        orderId: proof.orderId,
        detectedIssue: result.flags[0] || "ai_flagged",
        severity: "high",
        sourceUrl: proof.url,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      await db.collection("orders").doc(proof.orderId).update({ status: "verification_failed" });
    }
  });

export const onOrderStatusChange = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return;

    if (before.status !== after.status) {
      await db.collection("orderTracking").add({
        orderId: context.params.orderId,
        status: after.status,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (after.sellerId) {
        await updateTrustScore(after.sellerId);
      }
      if (after.buyerId) {
        await analyzeBehavior(after.buyerId);
      }
    }
  });

export const onFeedbackCreated = functions.firestore
  .document("feedback/{id}")
  .onCreate(async (snap, context) => {
    const feedback = snap.data();
    if (!feedback) return;

    // naive sentiment example (as before)
    const text = String(feedback.text || "").toLowerCase();
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    if (text.includes("great") || text.includes("excellent") || text.includes("love")) {
      sentiment = "positive";
    } else if (
      text.includes("bad") ||
      text.includes("disappointed") ||
      text.includes("poor")
    ) {
      sentiment = "negative";
    }

    await db.collection("feedback").doc(context.params.id).update({ sentiment });
    if (feedback.sellerId) {
      await updateTrustScore(feedback.sellerId);
    }
  });

/** -------------------------------
 *  GEN1 AUTH + CALLABLES (v1)
 *  ------------------------------- */
export const onusercreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL, phoneNumber } = user;
  const batch = db.batch();
  const userRef = db.collection("users").doc(uid);
  const handle = (email?.split("@")[0] || `user_${uid.substring(0, 5)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

  batch.set(userRef, {
    uid,
    handle,
    displayName: displayName || "New User",
    email: email || null,
    phone: phoneNumber || null,
    photoURL: photoURL || "",
    bio: "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    plan: "free",
    wallet_balance: 10,
    stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
    accessibility: {
      captions: false,
      highContrast: false,
      largeText: false,
      signPreferred: false,
    },
  });

  batch.set(db.collection("akiliPoints").doc(uid), {
    userId: uid,
    totalPoints: 0,
    lifetimePoints: 0,
    redeemedPoints: 0,
    level: "Bronze",
    lastEarnedAt: null,
  });

  batch.set(
    db.collection("wallets").doc(uid),
    {
      agentId: uid,
      balanceTZS: 0,
      earnedToday: 0,
      totalEarnings: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(db.collection("referrals").doc(uid), {
    uid,
    refCode: uid.slice(0, 6).toUpperCase(),
    referredBy: null,
    totalReferrals: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("commissions").doc(uid), {
    uid,
    totalEarnings: 0,
    pending: 0,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
  console.log(`✅ Smart bootstrap complete for ${email || uid}`);
});

export const onpostcreate = functions.firestore
  .document("posts/{postId}")
  .onCreate(async (snap) => {
    const post = snap.data();
    if (!post) return;
    const postRef = snap.ref;

    await awardPoints(post.authorId, 10, "Created a new post");

    const userStatsUpdate = db
      .collection("users")
      .doc(post.authorId)
      .update({
        "stats.postsCount": admin.firestore.FieldValue.increment(1),
      });
    const postTagsUpdate = postRef.update({ tags: post.tags || [] });

    await Promise.all([userStatsUpdate, postTagsUpdate]);
  });

export const buyPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated", "Login required.");

  const { uid } = context.auth;
  const { planId } = data || {};
  if (!planId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing planId.");
  }

  const planRef = db.collection("plans").doc(String(planId));
  const planDoc = await planRef.get();
  if (!planDoc.exists)
    throw new functions.https.HttpsError("not-found", "Plan not found");

  const plan = planDoc.data()!;
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (t) => {
    t.update(userRef, { plan: plan.id });
  });

  return { success: true, plan: planId };
});

import { onCall } from "firebase-functions/v2/https";

/***********************************************
 *  redeemReward (v2 HTTPS Callable)
 ***********************************************/
export const redeemReward = onCall(async (request) => {
  const auth = request.auth;
  const data = request.data;

  if (!auth) {
    throw new Error("User must be authenticated to redeem rewards.");
  }

  const userId = auth.uid;
  const rewardId = data?.rewardId;

  if (!rewardId) {
    throw new Error("Missing rewardId.");
  }

  const rewardRef = db.collection("rewardCatalog").doc(String(rewardId));
  const userPointsRef = db.collection("akiliPoints").doc(userId);

  return db.runTransaction(async (t) => {
    const rewardDoc = await t.get(rewardRef);
    const userPointsDoc = await t.get(userPointsRef);

    if (!rewardDoc.exists) {
      throw new Error("Reward not found.");
    }

    const reward = rewardDoc.data()!;
    const userPoints = userPointsDoc.data() || { totalPoints: 0 };

    if (userPoints.totalPoints < reward.costPoints) {
      throw new Error("Insufficient points.");
    }

    t.update(userPointsRef, {
      totalPoints: admin.firestore.FieldValue.increment(-reward.costPoints),
      redeemedPoints: admin.firestore.FieldValue.increment(reward.costPoints),
    });

    const historyRef = db.collection("rewardHistory").doc();
    t.set(historyRef, {
      userId,
      rewardId,
      points: reward.costPoints,
      type: "redeem",
      description: `Redeemed: ${reward.title}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (reward.type === "walletCredit" && reward.value > 0) {
      const walletRef = db.collection("wallets").doc(userId);
      t.set(
        walletRef,
        {
          balanceTZS: admin.firestore.FieldValue.increment(reward.value),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { success: true, message: `${reward.title} redeemed successfully!` };
  });
});

/***********************************************
 * seeddemo (back to v1)
 ***********************************************/
export const seeddemo = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { uid } = context.auth;

  await db.collection("posts").add({
    authorId: uid,
    media: {
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      type: "video",
    },
    thumbnailUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
    caption: "Having some fun with this demo video! #demo #akilipesa",
    tags: ["demo", "akilipesa", "fun"],
    likes: 1337,
    comments: 42,
    shares: 12,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: "Demo data seeded." };
});

/***********************************************
 *  VOICE CLONING UPLOAD → OPENVOICE WEBHOOK
 ***********************************************/
export { onVoiceUpload } from "./openvoiceTrigger";
