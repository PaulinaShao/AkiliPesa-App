'use strict';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

admin.initializeApp();

// --- Existing Functions ---

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
  return admin.firestore().collection('users').doc(user.uid).set(profile);
});

// Post created → increment user post count
export const onpostcreate = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap) => {
    const post = snap.data();
    if (!post) return null;

    return admin
      .firestore()
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
      const productRef = admin
        .firestore()
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

      await admin.firestore().collection('payments').add({
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

  const planRef = admin.firestore().collection('plans').doc(planId);
  const planDoc = await planRef.get();
  if (!planDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Plan not found');
  }

  const plan = planDoc.data()!;
  const userRef = admin.firestore().collection('users').doc(uid);

  await admin.firestore().runTransaction(async (t) => {
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

      const txRef = admin.firestore().collection('transactions').doc();
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

  await admin.firestore().collection('posts').add({
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
    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.where("wallet.plan.id", "==", "trial").get();

    if (snapshot.empty) {
      console.log("No trial users found to reset.");
      return null;
    }

    const batch = admin.firestore().batch();
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

// --- New Functions ---

const APP_ID = functions.config().agora?.appid || "e1b8492f15d848609591e0a29352c3c5";
const APP_CERTIFICATE = functions.config().agora?.certificate || "5718a99479a941f69201f807358b5493";

export const getAgoraToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { agentId, agentType, mode } = data;
    const callerId = context.auth.uid;
    const callRef = admin.firestore().collection('calls').doc();
    const channelName = callRef.id;

    let agentDoc;
    if (agentType === 'admin') {
        agentDoc = await admin.firestore().collection('adminAgents').doc(agentId).get();
    } else {
        // This assumes user agents are in a subcollection, adjust if needed.
        // The prompt seems to imply a subcollection `users/{uid}/agents/{agentId}`
        // This requires knowing the agent's owner, which isn't passed.
        // For now, let's assume a top-level `userAgents` collection for simplicity, or adjust if more info is given.
        // Let's stick to the prompt's `users/{uid}/agents/{agentId}` but that makes the query complex without ownerId.
        // Let's assume for now we can find the user agent without knowing the owner. A better model would be a top-level collection.
        // Re-reading: the user agent is under the user, so we need the user's ID to fetch it.
        // The call is made by the user, so we know their ID, but the agent could belong to another user.
        // Let's assume for now agentId is globally unique and we search for it.
        // This is inefficient. Let's assume `agentType: 'user'` means it belongs to the caller for now.
        const userAgentRef = admin.firestore().collection('users').doc(callerId).collection('agents').doc(agentId);
        agentDoc = await userAgentRef.get();
    }

    if (!agentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Agent not found.');
    }
    const agentData = agentDoc.data();
    const pricePerSecondCredits = agentData?.pricePerSecondCredits || 0.1;

    // Create call document
    const callDocData = {
        callId: callRef.id,
        channelName,
        callerId,
        agentId,
        agentType,
        mode,
        pricePerSecondCredits,
        status: 'active',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        creditsUsed: 0,
    };
    await callRef.set(callDocData);

    // Generate Agora Token
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, 0, role, privilegeExpiredTs);
    
    return { token, channelName, callId: callRef.id };
});

export const endCall = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { callId } = data;
    const callerId = context.auth.uid;

    const callRef = admin.firestore().collection('calls').doc(callId);
    const callDoc = await callRef.get();

    if (!callDoc.exists || callDoc.data()?.callerId !== callerId) {
        throw new functions.https.HttpsError('not-found', 'Call not found or permission denied.');
    }

    const callData = callDoc.data();
    if (callData?.status === 'ended') {
        return { success: true, message: 'Call already ended.' };
    }
    
    const endedAt = admin.firestore.Timestamp.now();
    const startedAt = callData?.startedAt as admin.firestore.Timestamp;
    const durationSeconds = endedAt.seconds - startedAt.seconds;
    
    const creditsUsed = durationSeconds * callData?.pricePerSecondCredits;

    // Update call doc
    await callRef.update({
        status: 'ended',
        endedAt: endedAt,
        creditsUsed: creditsUsed,
    });

    // Deduct credits from user's wallet
    const userRef = admin.firestore().collection('users').doc(callerId);
    await userRef.update({
        'wallet.credits': admin.firestore.FieldValue.increment(-creditsUsed),
        'wallet.lastDeduction': admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, creditsUsed };
});
