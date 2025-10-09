
'use strict';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// User signup → create profile
export const onusercreate = functions.auth.user().onCreate(async (user: functions.auth.UserRecord) => {
  const profile = {
    uid: user.uid,
    phone: user.phoneNumber || null,
    email: user.email || null,
    handle: user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`,
    displayName: user.displayName || 'New User',
    photoURL: user.photoURL || '',
    plan: 'free',
    walletBalance: 0,
    stats: { following: 0, followers: 0, likes: 0, postsCount: 0 },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  return admin.firestore().collection('users').doc(user.uid).set(profile);
});

// Post created → increment user post count
export const onpostcreate = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot) => {
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

// Order updated → trigger payments (stub)
export const onorderupdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const after = change.after.data();
    if (!after) return null;

    if (after.status === 'paid') {
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

      await admin
        .firestore()
        .collection('payments')
        .add({
          orderId: context.params.orderId,
          sellerId: after.sellerId,
          amountGross: after.amount,
          fees: { platform: after.amount * 0.1, taxes: after.amount * 0.05 },
          amountNet: after.amount * 0.85,
          status: 'completed',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    return null;
  });

// Callable demo seeder
export const seeddemo = functions.https.onCall(async (_data, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const uid = context.auth.uid;

  await admin
    .firestore()
    .collection('posts')
    .add({
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
