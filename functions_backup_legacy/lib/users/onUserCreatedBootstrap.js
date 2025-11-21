"use strict";
/**
 * User Onboarding Bootstrap
 * - Runs once when a new Firebase Auth user is created
 * - Creates/initializes:
 *   - users/{uid}          (basic profile shell)
 *   - wallets/{uid}        (wallet + trial plan)
 *   - akiliPoints/{uid}    (loyalty / rewards)
 *   - buyerTrust/{uid}     (buyer side trust)
 *   - trustScores/{uid}    (agent side trust)
 *   - revenueReports/{uid} (earnings/commission summary)
 */
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreatedBootstrap = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// You can tune these to match your pricing.json later
const TRIAL_PLAN_ID = "trial";
const TRIAL_CREDITS = 60; // total starting credits (any mix of audio/video)
const TRIAL_EXPIRY_DAYS = 14; // trial duration
exports.onUserCreatedBootstrap = functions.auth.user().onCreate(async (user) => {
    const uid = user.uid;
    const now = admin.firestore.Timestamp.now();
    const trialExpiryDate = new Date();
    trialExpiryDate.setDate(trialExpiryDate.getDate() + TRIAL_EXPIRY_DAYS);
    const walletRef = db.doc(`wallets/${uid}`);
    const pointsRef = db.doc(`akiliPoints/${uid}`);
    const buyerTrustRef = db.doc(`buyerTrust/${uid}`);
    const trustScoresRef = db.doc(`trustScores/${uid}`);
    const revenueReportRef = db.doc(`revenueReports/${uid}`);
    const userDocRef = db.doc(`users/${uid}`);
    await db.runTransaction(async (tx) => {
        // 1) Basic user profile shell
        const userSnap = await tx.get(userDocRef);
        if (!userSnap.exists) {
            tx.set(userDocRef, {
                displayName: user.displayName ?? null,
                photoURL: user.photoURL ?? null,
                email: user.email ?? null,
                phoneNumber: user.phoneNumber ?? null,
                createdAt: now,
                lastLoginAt: now,
                role: "user", // can later be "agent", "admin"
                isAgent: false,
                isVerified: false,
            });
        }
        // 2) Wallet + trial plan
        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists) {
            tx.set(walletRef, {
                currency: "TZS",
                balanceTZS: 0, // cash balance
                escrowTZS: 0, // locked funds
                plan: {
                    id: TRIAL_PLAN_ID,
                    credits: TRIAL_CREDITS,
                    expiry: admin.firestore.Timestamp.fromDate(trialExpiryDate),
                },
                totalCreditsPurchased: 0,
                totalCreditsUsed: 0,
                createdAt: now,
                updatedAt: now,
            });
        }
        // 3) Loyalty / rewards
        const pointsSnap = await tx.get(pointsRef);
        if (!pointsSnap.exists) {
            tx.set(pointsRef, {
                totalPoints: 0,
                availablePoints: 0,
                totalRedeemed: 0,
                createdAt: now,
                updatedAt: now,
            });
        }
        // 4) Buyer trust (for normal users buying things)
        const buyerTrustSnap = await tx.get(buyerTrustRef);
        if (!buyerTrustSnap.exists) {
            tx.set(buyerTrustRef, {
                score: 50, // baseline neutral score
                level: "New",
                totalOrders: 0,
                totalCompletedOrders: 0,
                totalDisputes: 0,
                createdAt: now,
                updatedAt: now,
            });
        }
        // 5) Agent trust (for when they become an agent)
        const trustScoresSnap = await tx.get(trustScoresRef);
        if (!trustScoresSnap.exists) {
            tx.set(trustScoresRef, {
                agentScore: 0,
                ratingCount: 0,
                avgRating: 0,
                completedSessions: 0,
                completedOrders: 0,
                createdAt: now,
                updatedAt: now,
            });
        }
        // 6) Revenue / earnings summary (for agents + normal sellers)
        const revenueSnap = await tx.get(revenueReportRef);
        if (!revenueSnap.exists) {
            tx.set(revenueReportRef, {
                totalEarnedTZS: 0, // all income (calls, product sales, services)
                totalCommissionTZS: 0, // commission from promoting others
                totalSpentTZS: 0, // what they spent on calls, content, purchases
                totalWithdrawnTZS: 0, // cash withdrawn to M-Pesa/Bank/etc.
                lastPayoutAt: null,
                updatedAt: now,
            });
        }
    });
    console.log(`[onUserCreatedBootstrap] Initialized finance profile for uid=${uid}`);
});
//# sourceMappingURL=onUserCreatedBootstrap.js.map