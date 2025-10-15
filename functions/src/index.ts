
'use strict';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import fetch from "node-fetch";

admin.initializeApp();
const db = admin.firestore();


// --- V2 Functions ---

// 🔹 Trigger when a sale record is created
export const onSaleCreated = onDocumentCreated("sales/{saleId}", async (event) => {
  const saleData = event.data?.data();
  if (!saleData) {
    console.log("No data associated with the event.");
    return;
  }
  
  const { agentId, type, amount } = saleData;
  if (!agentId || !type || !amount) {
    console.log(`Missing required fields in sale doc: ${event.params.saleId}`);
    return;
  }

  // Fetch commission rates from a single admin config document
  const configDoc = await db.doc("commissionRates/adminConfig").get();
  const config = configDoc.data();
  const productRate = config?.productCommission ?? 0.9; // Default 90%
  const serviceRate = config?.serviceCommission ?? 0.6; // Default 60%
  const callRate = config?.callCommission ?? 0; // Default 0%

  let commission = 0;
  if (type === "product") commission = amount * productRate;
  if (type === "service") commission = amount * serviceRate;
  if (type === "call") commission = amount * callRate;

  // Skip if no commission is earned
  if (commission <= 0) {
    console.log(`No commission for sale type '${type}' on sale ${event.params.saleId}`);
    return;
  }

  // Use a transaction to ensure atomicity
  const walletRef = db.collection("wallets").doc(agentId);
  const transactionRef = db.collection("walletTransactions").doc();
  
  await db.runTransaction(async (t) => {
    // 1. Record the transaction
    t.set(transactionRef, {
      agentId,
      saleId: event.params.saleId,
      amount: commission,
      type: "credit",
      source: type,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      description: `Commission from ${type} sale`
    });

    // 2. Update wallet, creating it if it doesn't exist
    t.set(walletRef, {
      agentId,
      balanceTZS: admin.firestore.FieldValue.increment(commission),
      earnedToday: admin.firestore.FieldValue.increment(commission),
      totalEarnings: admin.firestore.FieldValue.increment(commission),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

  console.log(`Processed commission of ${commission} for agent ${agentId} from sale ${event.params.saleId}`);
});

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


// --- V1 Functions ---

// User signup → create profile
export const onusercreate = functions.auth.user().onCreate(async (user) => {
  const profile = {
    uid: user.uid,
    phone: user.phoneNumber || null,
    email: user.email || null,
    handle: user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`,
    displayName: user.displayName || 'New User',
    photoURL: user.photoURL || '',
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
    stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  return db.collection('users').doc(user.uid).set(profile);
});

// Post created → increment user post count
export const onpostcreate = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap) => {
    const post = snap.data();
    if (!post) return null;

    return db
      .collection('users')
      .doc(post.authorId)
      .update({
        'stats.postsCount': admin.firestore.FieldValue.increment(1),
      });
  });

// Order updated → trigger payments
export const onorderupdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    if (!after) return null;

    if (after.status === 'paid') {
      const productRef = db
        .collection('products')
        .doc(after.productId);
      await productRef.update({
        'metrics.unitsSold': admin.firestore.FieldValue.increment(
          after.quantity
        ),
        'metrics.revenue': admin.firestore.FieldValue.increment(after.amount),
      });

      const commissionRate = 0.1; // 10%
      const ownerShare = after.amount * (1 - commissionRate);
      const akilipesaShare = after.amount * commissionRate;

      await db.collection('payments').add({
        orderId: context.params.orderId,
        sellerId: after.sellerId,
        amountGross: after.amount,
        fees: { platform: akilipesaShare, taxes: 0, transferFee: 0 },
        amountNet: ownerShare,
        breakdown: {
          ownerShare,
          akilipesaShare,
          commissionShare: 0, // Assuming no separate affiliate commission here
        },
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return null;
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
