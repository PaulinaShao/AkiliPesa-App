
'use strict';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import fetch from "node-fetch";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from 'firebase-functions/v2/https';
import { enforceTransactionUid } from "./enforceTransactionUid";
import { realtimePayoutManager } from "./realtimePayoutManager";

admin.initializeApp();
const db = admin.firestore();


// --- V2 Functions ---

export { enforceTransactionUid, realtimePayoutManager };

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/your-webhook-id"; // IMPORTANT: Replace with your real Make.com webhook URL

export const onWithdrawalApproved = onDocumentUpdated("withdrawalRequests/{reqId}", async (event) => {
  if (!event.data) {
      return;
  }
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only trigger when status changes from something else to "approved"
  if (before.status !== "approved" && after.status === "approved") {
    const payload = {
      requestId: event.params.reqId,
      agentId: after.agentId,
      amount: after.amount,
      paymentMethod: after.paymentMethod,
      walletNumber: after.walletNumber
    };

    console.log(`Triggering payout for requestId: ${payload.requestId}`);

    // Send payout trigger to Make.com
    try {
        const res = await fetch(MAKE_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            await db.collection("walletTransactions").add({
                agentId: after.agentId,
                amount: -after.amount, // Record as a debit
                type: "debit",
                source: "withdrawal",
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                description: `Payout approved for ${after.paymentMethod.toUpperCase()}`
            });
            console.log(`✅ Payout triggered successfully for ${payload.requestId}`);
        } else {
            // If Make.com returns an error, log it and potentially set status to 'failed'
            const errorText = await res.text();
            console.error(`❌ Make webhook error for ${payload.requestId}: ${res.statusText}`, errorText);
            await db.collection("withdrawalRequests").doc(event.params.reqId).update({
                status: 'failed',
                error: `Make.com webhook failed: ${res.statusText}`
            });
        }
    } catch (error) {
        console.error(`❌ Error calling Make webhook for ${payload.requestId}:`, error);
        await db.collection("withdrawalRequests").doc(event.params.reqId).update({
            status: 'failed',
            error: (error as Error).message
        });
    }
  }
});

// Aggregate totals daily for performance
export const aggregateDailyRevenue = onSchedule("every day 00:00", async () => {
    const salesSnap = await db.collection("sales").get();
    const payoutsSnap = await db.collection("withdrawalRequests").get();
  
    let totalSales = 0;
    let totalCommission = 0;
    let totalPayouts = 0;
  
    salesSnap.forEach((doc) => {
      const s = doc.data();
      totalSales += s.amount || 0;
      totalCommission += s.amount * (s.type === "product" ? 0.9 : 0.6); // Consider making rates dynamic from config
    });
  
    payoutsSnap.forEach((p) => {
      if (p.data().status === "paid") {
        totalPayouts += p.data().amount;
      }
    });
  
    const totalPlatformFee = totalSales - totalCommission;
    const netProfit = totalPlatformFee; // Payouts are fund transfers, not operational costs vs fee
  
    await db.collection("revenueReports").doc(new Date().toISOString().split("T")[0]).set({
      totalSales,
      totalCommission,
      totalPlatformFee,
      totalPayouts,
      netProfit,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Daily revenue report generated.");
});


// Scheduled function to update agent ranks nightly
export const updateAgentRanks = onSchedule("every day 02:00", async () => {
    const snap = await db.collection("agentStats").get();
    
    const batch = db.batch();

    snap.forEach(doc => {
        const d = doc.data();
        let rank = "Bronze"; // Default rank

        if (d.totalSales >= 50 && d.totalRevenue >= 800000) {
            rank = "Platinum";
        } else if (d.totalSales >= 25 && d.totalRevenue >= 300000) {
            rank = "Gold";
        } else if (d.totalSales >= 10 && d.totalRevenue >= 100000) {
            rank = "Silver";
        }
        
        // Only update if the rank has changed
        if (d.rank !== rank) {
            const agentRef = db.collection("agentStats").doc(doc.id);
            batch.update(agentRef, { rank: rank });
        }
    });

    await batch.commit();
    console.log(`Agent rank update job completed. Processed ${snap.size} agents.`);
});


// Helper function to award points
async function awardPoints(userId: string, points: number, reason: string) {
  if (!userId || !points || points <= 0) {
    console.log(`Invalid attempt to award points: userId=${userId}, points=${points}`);
    return;
  }
  const ref = db.collection("akiliPoints").doc(userId);
  await ref.set({
    userId,
    totalPoints: admin.firestore.FieldValue.increment(points),
    lifetimePoints: admin.firestore.FieldValue.increment(points),
    lastEarnedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return db.collection("rewardHistory").add({
    userId,
    points,
    reason,
    type: "earned",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    isRead: false
  });
}

// Product/service sale -> seller reward
export const onProductSaleReward = onDocumentCreated("sales/{saleId}", async (event) => {
  const sale = event.data?.data();
  if (!sale) return;
  const points = Math.floor(sale.amount * 0.01); // 1 point per 100 TZS
  if (points > 0) {
    await awardPoints(sale.agentId, points, "Product sale reward");
  }
});

// Referral conversion -> referrer reward
export const onReferralReward = onDocumentCreated("referrals/{refId}", async (event) => {
  const ref = event.data?.data();
  if (ref && ref.status === "converted") {
    await awardPoints(ref.sharedBy, 50, "Referral conversion reward");
  }
});

// AI engagement -> AkiliPesa AI agent reward
export const onAIInteractionReward = onDocumentUpdated("aiSessions/{id}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  // Trigger when session ends
  if (before?.isActive === true && after?.isActive === false && after.duration > 60) {
    const points = Math.floor(after.duration / 60) * 10;
    await awardPoints(after.userId, points, "AI session engagement");
  }
});

// Redeem points for a reward
export const redeemReward = onCall(async (req) => {
  if (!req.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to redeem rewards.');
  }
  const userId = req.auth.uid;
  const { rewardId } = req.data;
  if (!rewardId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing rewardId.');
  }
  
  const rewardRef = db.collection("rewardCatalog").doc(rewardId);
  const userPointsRef = db.collection("akiliPoints").doc(userId);

  return db.runTransaction(async (t) => {
    const rewardDoc = await t.get(rewardRef);
    const userPointsDoc = await t.get(userPointsRef);

    if (!rewardDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Reward not found.');
    }
    const reward = rewardDoc.data()!;
    const userPoints = userPointsDoc.data() || { totalPoints: 0 };

    if (userPoints.totalPoints < reward.costPoints) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient points.');
    }

    t.update(userPointsRef, {
      totalPoints: admin.firestore.FieldValue.increment(-reward.costPoints),
      redeemedPoints: admin.firestore.FieldValue.increment(reward.costPoints)
    });

    const historyRef = db.collection("rewardHistory").doc();
    t.set(historyRef, {
      userId,
      rewardId,
      points: reward.costPoints,
      type: "redeem",
      description: `Redeemed: ${reward.title}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    if (reward.type === "walletCredit" && reward.value > 0) {
      const walletRef = db.collection("wallets").doc(userId);
      t.set(walletRef, {
        balanceTZS: admin.firestore.FieldValue.increment(reward.value),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    return { success: true, message: `${reward.title} redeemed successfully!` };
  });
});

// --- Phase 7 Functions ---

// 1. Create escrow on new order
export const createEscrowOnOrder = onDocumentCreated("orders/{orderId}", async (event) => {
    const order = event.data?.data();
    if (!order) return;
    const escrowRef = db.collection("escrow").doc();
    await escrowRef.set({
        orderId: event.params.orderId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        amount: order.amount,
        status: "held",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // Update order with escrow ID and new status
    await db.collection("orders").doc(event.params.orderId).update({ 
        escrowId: escrowRef.id, 
        status: "paid" 
    });
});

// 2. AI delivery verification -> auto-release
export const verifyAndReleaseEscrow = onDocumentUpdated("deliveryProofs/{id}", async (event) => {
    if (!event.data) return;
    const before = event.data.before.data();
    const after = event.data.after.data();
    
    // Check if already verified to prevent re-triggering
    if (before.verified === true || after.verified !== true) return;

    const orderDoc = await db.collection("orders").doc(after.orderId).get();
    if (!orderDoc.exists) return;
    const order = orderDoc.data()!;

    // Phase 8 Enhancement: Check product verification status
    const verificationDoc = await db.collection("productVerification").doc(order.productId).get();
    const verification = verificationDoc.data();
    if (verification && verification.status !== "verified") {
        console.log(`⚠️ Product ${order.productId} not verified, skipping escrow release for order ${after.orderId}`);
        await db.collection("escrow").doc(order.escrowId).update({
            status: "hold_for_review"
        });
        return;
    }
    
    const aiVerified = after.verified === true;
    
    if (aiVerified) {
        await db.collection("escrow").doc(order.escrowId).update({
            status: "released",
            releasedAt: admin.firestore.FieldValue.serverTimestamp(),
            verified: true
        });
        await db.collection("orders").doc(after.orderId).update({ status: "completed" });
    }
});

// 3. Order Tracking Logic & Trust Score Trigger
export const onOrderStatusChange = onDocumentUpdated("orders/{orderId}", async (event) => {
    if (!event.data) return;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== after.status) {
        await db.collection("orderTracking").add({
            orderId: event.params.orderId,
            status: after.status,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Phase 9 & 10: Trigger trust score update on order status change
        if (after.sellerId) {
            await updateTrustScore(after.sellerId);
        }
        if (after.buyerId) {
            await analyzeBehavior(after.buyerId);
        }
    }
});

// 4. Refund Handling
export const onRefundRequest = onDocumentCreated("refunds/{id}", async (event) => {
    const r = event.data?.data();
    if (!r) return;
    
    const escrowRef = db.collection("escrow").doc(r.escrowId);
    const escrowDoc = await escrowRef.get();
    if (!escrowDoc.exists) return;

    const escrow = escrowDoc.data()!;
    await escrowRef.update({ status: "refund_pending" });
    await db.collection("orders").doc(escrow.orderId).update({ status: "refund_requested" });
    // Optional: notify admin channel via email/webhook here
});


// --- Phase 8 Functions ---

// Helper function to simulate calling an external AI for verification
async function verifyMediaWithAI(imageUrl: string, type: string) {
  try {
    // This is a placeholder for a real API call to a service like OpenAI Vision
    // In a real implementation, you would use `fetch` to call the AI endpoint.
    console.log(`Verifying ${type} media: ${imageUrl}`);

    // Simulate AI response logic
    const isSuspicious = imageUrl.includes("suspicious") || Math.random() < 0.1; // 10% chance of being flagged
    
    if (isSuspicious) {
      return {
        verified: false,
        flags: ["ai_flag_suspicious_content"],
        confidence: 0.45,
        aiVendor: "Simulated_AI_Vision"
      };
    }

    return {
      verified: true,
      flags: [],
      confidence: 0.97,
      aiVendor: "Simulated_AI_Vision"
    };

  } catch (err) {
    console.error("AI verification error:", err);
    return { verified: false, flags: ["ai_check_failed"], confidence: 0.1, aiVendor: "Simulated_AI_Vision" };
  }
}

// 1. Product Listing Verification
export const onProductCreatedVerify = onDocumentCreated("products/{productId}", async (event) => {
  const product = event.data?.data();
  if (!product || !product.media) {
    console.log(`Product ${event.params.productId} has no media to verify.`);
    return;
  }

  const result = await verifyMediaWithAI(product.media, "product");
  
  await db.collection("productVerification").doc(event.params.productId).set({
    productId: event.params.productId,
    sellerId: product.ownerId,
    status: result.verified ? "verified" : "flagged",
    confidenceScore: result.confidence,
    flags: result.flags,
    aiVendor: result.aiVendor,
    checkedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Phase 9: Trigger trust score update
  if(product.ownerId) {
    await updateTrustScore(product.ownerId);
  }
});

// 2. Delivery Proof Verification
export const onDeliveryProofAdded = onDocumentCreated("deliveryProofs/{id}", async (event) => {
  const proof = event.data?.data();
  if (!proof || !proof.url) {
      console.log(`Delivery proof ${event.params.id} has no URL to verify.`);
      return;
  }

  const result = await verifyMediaWithAI(proof.url, "delivery");

  // Update the proof itself with verification status
  await db.collection("deliveryProofs").doc(event.params.id).update({
      verified: result.verified,
      verificationFlags: result.flags
  });
  
  if (!result.verified) {
    await db.collection("mediaReports").add({
      fileId: event.params.id,
      orderId: proof.orderId,
      detectedIssue: result.flags[0] || "ai_flagged",
      severity: "high",
      sourceUrl: proof.url,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    // This status update will be picked up by onOrderStatusChange
    await db.collection("orders").doc(proof.orderId).update({ status: "verification_failed" });
  }
});


// --- Phase 9 Functions ---

/**
 * Simulates analyzing sentiment of a given text.
 * In a real-world scenario, this would call an external NLP API.
 * @param {string} feedbackText The text to analyze.
 * @returns {Promise<string>} 'positive', 'negative', or 'neutral'.
 */
async function analyzeSentiment(feedbackText: string): Promise<string> {
    console.log(`Analyzing sentiment for: "${feedbackText}"`);
    // This is a placeholder for a real API call.
    const lowerText = feedbackText.toLowerCase();
    if (lowerText.includes("great") || lowerText.includes("excellent") || lowerText.includes("love")) {
        return "positive";
    }
    if (lowerText.includes("bad") || lowerText.includes("disappointed") || lowerText.includes("poor")) {
        return "negative";
    }
    return "neutral";
}


/**
 * Recalculates and updates a seller's trust score based on various metrics.
 * @param {string} sellerId The ID of the seller to update.
 */
async function updateTrustScore(sellerId: string) {
    if (!sellerId) {
        console.log("updateTrustScore called with no sellerId.");
        return;
    }

    const productsSnap = await db.collection("productVerification").where("sellerId", "==", sellerId).get();
    const verified = productsSnap.docs.filter(d => d.data().status === "verified").length;
    const flagged = productsSnap.docs.filter(d => d.data().status === "flagged").length;

    const ordersSnap = await db.collection("orders").where("sellerId", "==", sellerId).get();
    const onTime = ordersSnap.docs.filter(d => d.data().status === "completed").length;
    const late = ordersSnap.docs.filter(d => d.data().status === "late" || d.data().status === "refund_requested").length;

    const feedbacksSnap = await db.collection("feedback").where("sellerId", "==", sellerId).get();
    const pos = feedbacksSnap.docs.filter(d => d.data().sentiment === "positive").length;
    const neg = feedbacksSnap.docs.filter(d => d.data().sentiment === "negative").length;
    
    // Weighted score calculation
    const baseScore = 70;
    const score = Math.max(0, Math.min(100,
        baseScore + (verified * 0.2) - (flagged * 5) + (onTime * 0.5) - (late * 2) + (pos * 0.3) - (neg * 3)
    ));

    const level = score >= 90 ? "Platinum" : score >= 80 ? "Gold" : score >= 60 ? "Silver" : "Bronze";

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
            feedbackNegative: neg
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save current score
    await db.collection("trustScores").doc(sellerId).set(scoreData, { merge: true });

    // Log historical score
    await db.collection("trustHistory").add({
        sellerId,
        trustScore: score,
        level,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Updated trust score for seller ${sellerId} to ${score} (${level})`);
}


/**
 * Triggered when new feedback is created. Analyzes sentiment and updates trust score.
 */
export const onFeedbackCreated = onDocumentCreated("feedback/{id}", async (event) => {
    const feedback = event.data?.data();
    if (!feedback) return;

    const sentiment = await analyzeSentiment(feedback.text);
    
    // Update the feedback doc with the sentiment
    await db.collection("feedback").doc(event.params.id).update({ sentiment });
    
    // Trigger a trust score update for the seller
    if(feedback.sellerId) {
        await updateTrustScore(feedback.sellerId);
    }
});


// --- Phase 10 Functions ---

async function analyzeBehavior(buyerId: string) {
    if (!buyerId) {
        console.log("analyzeBehavior called with no buyerId.");
        return;
    }

    const ordersSnap = await db.collection("orders").where("buyerId", "==", buyerId).get();
    const onTime = ordersSnap.docs.filter(d => d.data().status === "completed").length;
    const late = ordersSnap.docs.filter(d => d.data().status === "late").length;
    const refunds = ordersSnap.docs.filter(d => d.data().status === "refund_requested" || d.data().status === "refunded").length;

    const feedbacksSnap = await db.collection("feedback").where("buyerId", "==", buyerId).get();
    const pos = feedbacksSnap.docs.filter(d => d.data().sentiment === "positive").length;
    const neg = feedbacksSnap.docs.filter(d => d.data().sentiment === "negative").length;

    // Weighted score calculation
    const baseScore = 70;
    const score = Math.max(0, Math.min(100,
        baseScore + (onTime * 0.3) - (late * 3) - (refunds * 5) + (pos * 0.5) - (neg * 3)
    ));

    const level = score >= 90 ? "Platinum" : score >= 80 ? "Gold" : score >= 60 ? "Silver" : "Bronze";

    const scoreData = {
        buyerId,
        trustScore: score,
        level,
        metrics: {
            onTimePayments: onTime,
            latePayments: late,
            refundsRequested: refunds,
            positiveFeedback: pos,
            negativeFeedback: neg
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("buyerTrust").doc(buyerId).set(scoreData, { merge: true });

    await db.collection("buyerHistory").add({
        buyerId,
        trustScore: score,
        level,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Updated buyer trust score for ${buyerId} to ${score} (${level})`);
}


// --- V1 Functions ---

/**
 * Smart user bootstrap function.
 * Triggered once when a user is created.
 * Ensures all necessary user-related documents are created atomically.
 */
export const onusercreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL, phoneNumber } = user;
    const batch = db.batch();

    // 1. User Profile
    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, {
        uid,
        handle: email?.split('@')[0] || `user_${uid.substring(0, 5)}`,
        displayName: displayName || 'New User',
        email: email || null,
        phone: phoneNumber || null,
        photoURL: photoURL || '',
        bio: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        wallet: {
            balance: 10,
            escrow: 0,
            plan: {
                id: 'trial',
                credits: 10,
            },
            lastDeduction: null,
            lastTrialReset: admin.firestore.FieldValue.serverTimestamp(),
        },
        stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
    });

    // 2. AkiliPoints Record
    const pointsRef = db.collection("akiliPoints").doc(uid);
    batch.set(pointsRef, {
        userId: uid,
        totalPoints: 0,
        lifetimePoints: 0,
        redeemedPoints: 0,
        level: 'Bronze',
        lastEarnedAt: null,
    });

    // 3. Wallet Record
    const walletRef = db.collection("wallets").doc(uid);
    batch.set(walletRef, {
        agentId: uid,
        balanceTZS: 0,
        earnedToday: 0,
        totalEarnings: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 4. Referral Record
    const referralRef = db.collection("referrals").doc(uid);
    batch.set(referralRef, {
        uid,
        refCode: uid.slice(0, 6).toUpperCase(),
        referredBy: null,
        totalReferrals: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // 5. Commission Record
    const commissionRef = db.collection("commissions").doc(uid);
    batch.set(commissionRef, {
        uid,
        totalEarnings: 0,
        pending: 0,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });


    await batch.commit();
    console.log(`✅ Smart bootstrap complete for ${email || uid}`);
});

// Post created → increment user post count
export const onpostcreate = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap) => {
    const post = snap.data();
    if (!post) return null;

    // Award points for creating a post
    await awardPoints(post.authorId, 10, "Created a new post");

    return db
      .collection('users')
      .doc(post.authorId)
      .update({
        'stats.postsCount': admin.firestore.FieldValue.increment(1),
      });
  });

// Callable function to buy a plan
export const buyPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Login required.'
    );
  }

  const uid = context.auth.uid;
  const { planId, method } = data;

  const planRef = db.collection('plans').doc(planId);
  const planDoc = await planRef.get();
  if (!planDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Plan not found');
  }

  const plan = planDoc.data()!;
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    const wallet = userDoc.data()?.wallet || { balance: 0, plan: {} };

    if (method === 'wallet') {
      if (wallet.balance < plan.price) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Insufficient wallet balance'
        );
      }
      t.update(userRef, {
        'wallet.balance': admin.firestore.FieldValue.increment(-plan.price),
        'wallet.plan': {
          id: planId,
          credits: admin.firestore.FieldValue.increment(plan.credits),
          expiry: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + plan.validityDays * 86400000)
          ),
        },
      });

      const txRef = db.collection('transactions').doc();
      t.set(txRef, {
        uid,
        amount: -plan.price,
        currency: 'TZS',
        type: 'purchase',
        method: 'wallet',
        description: `Plan purchase: ${plan.name}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  return { success: true, plan: planId };
});

// Callable demo seeder
export const seeddemo = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const uid = context.auth.uid;

  await db.collection('posts').add({
    authorId: uid,
    media: { url: 'https://placekitten.com/200/200', type: 'image' },
    caption: 'Hello AkiliPesa!',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    likes: 0,
    comments: 0,
    shares: 0,
    visibility: 'public',
  });

  return { success: true, message: 'Demo data seeded.' };
});

// Daily trial credit reset
export const resetTrialCredits = functions.pubsub
  .schedule("every day 00:00")
  .onRun(async () => {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("wallet.plan.id", "==", "trial").get();

    if (snapshot.empty) {
      console.log("No trial users found to reset.");
      return null;
    }

    const batch = db.batch();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    snapshot.docs.forEach(doc => {
      const user = doc.data();
      const lastReset = user.wallet.lastTrialReset?.toDate();
      
      // Check if last reset was before today
      if (!lastReset || lastReset.getTime() < today.getTime()) {
        const userRef = usersRef.doc(doc.id);
        batch.update(userRef, {
          "wallet.balance": 10,
          "wallet.credits": 10,
          "wallet.lastTrialReset": admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    await batch.commit();
    console.log(`Reset trial credits for ${snapshot.size} users.`);
    return null;
  });

/** getAgoraToken — validates wallet, reads agent pricing, logs call, returns token */
export const getAgoraToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  const uid = context.auth.uid;
  const { agentId, agentType, mode, channelName: requestedChannelName } = data as { agentId: string; agentType: 'admin'|'user'; mode: 'audio'|'video', channelName?: string };
  if (!agentId || !agentType || !mode) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

  // Fetch caller wallet
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  const wallet = (userDoc.data() as any).wallet || { balance: 0, credits: 0 };

  // Resolve agent + price
  let pricePerSecondCredits = 0.1;
  if (agentType === 'admin') {
    const a = await db.collection('adminAgents').doc(agentId).get();
    if (!a.exists) throw new functions.https.HttpsError('not-found', 'Admin agent not found');
    if ((a.data() as any).status !== 'active') throw new functions.https.HttpsError('failed-precondition', 'Agent inactive');
    pricePerSecondCredits = (a.data() as any).pricePerSecondCredits ?? 0.1;
  } else {
     throw new functions.https.HttpsError('unimplemented', 'Calling user-created agents is not yet supported.');
  }

  // Simple pre-check (must have at least 1 second of credit)
  if ((wallet.credits ?? 0) < pricePerSecondCredits) {
    throw new functions.https.HttpsError('failed-precondition', 'Insufficient credits. Please recharge.');
  }

  // Create channel + token
  const channelName = requestedChannelName || `akili_${Date.now()}_${Math.floor(Math.random()*9999)}`;
  const appId = functions.config().agora?.appid;
  const appCert = functions.config().agora?.certificate;

  if (!appId || !appCert) {
      throw new functions.https.HttpsError('failed-precondition', 'Agora credentials are not configured.');
  }

  const expire = 3600;
  const token = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channelName, 0, RtcRole.PUBLISHER, expire);

  // Log call session
  const callRef = db.collection('calls').doc();
  await callRef.set({
    callId: callRef.id,
    channelName, callerId: uid, agentId, agentType, mode,
    status: 'active', creditsUsed: 0, pricePerSecondCredits,
    startedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { token, channelName, callId: callRef.id, appId };
});

/** endCall — closes call, finalizes billing now (client calls on hangup) */
export const endCall = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  const uid = context.auth.uid;
  const { callId, seconds } = data as { callId: string; seconds: number };
  if (!callId || typeof seconds !== 'number') throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

  const callRef = db.collection('calls').doc(callId);
  const snap = await callRef.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Call not found');
  const call = snap.data() as any;
  if (call.callerId !== uid) throw new functions.https.HttpsError('permission-denied', 'Only caller can end the call');
  
  if (call.status === 'ended') {
      return { ok: true, message: 'Call already ended.' };
  }

  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (t) => {
    const u = await t.get(userRef);
    if (!u.exists) throw new functions.https.HttpsError('not-found', 'User profile not found for billing.');
    const wallet = (u.data() as any).wallet || { credits: 0 };
    const creditsToCharge = Math.ceil(seconds) * (call.pricePerSecondCredits ?? 0.1);
    
    t.update(userRef, {
        'wallet.credits': admin.firestore.FieldValue.increment(-creditsToCharge),
        'wallet.lastDeduction': admin.firestore.FieldValue.serverTimestamp(),
    });
    
    t.update(callRef, {
      status: 'ended',
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      creditsUsed: creditsToCharge,
    });

    // Transaction log
    const txRef = db.collection('transactions').doc();
    t.set(txRef, {
      txId: txRef.id,
      uid, 
      amount: -creditsToCharge, 
      currency: 'credits',
      type: 'deduction',
      method: 'wallet',
      description: `Call ${call.mode} with ${call.agentType}:${call.agentId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

/** (Optional) scheduler for long-running calls as a safety net */
export const tickCalls = functions.pubsub.schedule('every 2 minutes').onRun(async () => {
  // This function can be used in the future to implement custom session management,
  // such as checking for user inactivity or enforcing periodic re-authentication.
  // For now, it performs no operation.
  return null;
});
