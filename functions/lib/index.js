'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeddemo = exports.onorderupdate = exports.onpostcreate = exports.onusercreate = void 0;
const admin = __importStar(require("firebase-admin"));
const options_1 = require("firebase-functions/v2/options");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const identity_1 = require("firebase-functions/v2/identity");
admin.initializeApp();
(0, options_1.setGlobalOptions)({ region: 'us-central1' });
// Trigger when a new user signs up
exports.onusercreate = (0, identity_1.onUserCreated)(async (event) => {
    const user = event.data;
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
exports.onpostcreate = (0, firestore_1.onDocumentCreated)('posts/{postId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log('No data associated with the event');
        return;
    }
    const post = snap.data();
    if (post?.authorId) {
        await admin.firestore().collection('users').doc(post.authorId).update({
            'stats.postsCount': admin.firestore.FieldValue.increment(1),
        });
    }
});
// Trigger when an order is updated
exports.onorderupdate = (0, firestore_1.onDocumentUpdated)('orders/{orderId}', async (event) => {
    const after = event.data?.after.data();
    const orderId = event.params.orderId;
    if (after?.status === 'paid') {
        // Example: update product metrics & create payment record
        const productRef = admin
            .firestore()
            .collection('products')
            .doc(after.productId);
        await productRef.update({
            'metrics.unitsSold': admin.firestore.FieldValue.increment(after.quantity),
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
exports.seeddemo = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new options_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const uid = request.auth.uid;
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
