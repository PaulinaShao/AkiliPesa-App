'use strict';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();
functions.setGlobalOptions({ region: 'us-central1' });

// Trigger when a new user signs up
export const onusercreate = functions.auth.user().onCreate(async user => {
  const profile = {
    uid: user.uid,
    phone: user.phoneNumber || null,
    email: user.email || null,
    handle: user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`,
    displayName: user.displayName || 'New User',
    bio: '',
    photoURL: user.photoURL || '',
    plan: 'free',
    walletBalance: 0,
    stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore().collection('users').doc(user.uid).set(profile);
});

// Trigger when a post is created
export const onpostcreate = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    if (post?.authorId) {
      await admin.firestore().collection('users').doc(post.authorId).update({
        'stats.postsCount': admin.firestore.FieldValue.increment(1),
      });
    }
  });

// Trigger when an order is updated
export const onorderupdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const orderId = context.params.orderId;

    if (after?.status === 'paid') {
      // Example: update product metrics & create payment record
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

      await admin.firestore().collection('payments').add({
        orderId: orderId,
        sellerId: after.sellerId,
        amountGross: after.amount,
        fees: { platform: after.amount * 0.1, taxes: after.amount * 0.05 },
        amountNet: after.amount * 0.85,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

// Seed demo data
export const seeddemo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const uid = context.auth.uid;
  await admin.firestore().collection('users').doc(uid).set({
    uid,
    displayName: 'Demo User',
    handle: 'demo',
    bio: 'Seeded demo profile',
    walletBalance: 100,
    stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});
