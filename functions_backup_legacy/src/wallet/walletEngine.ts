import * as admin from "firebase-admin";

const db = admin.firestore();

// Config – adjust to your business logic
const AUDIO_CREDITS_PER_SECOND = 1; // you already chose
const VIDEO_CREDITS_PER_SECOND = 3;
const TZS_PER_CALL_CREDIT = 50; // example: 1 credit = 50 TZS (change for production)
const LOW_WALLET_THRESHOLD_TZS = 2000;
const LOW_PLAN_THRESHOLD_SECONDS = 60;

export type CallMode = "audio" | "video";

export interface ChargeResult {
  chargedFromPlanCredits: number;
  chargedFromWalletTZS: number;
  remainingCreditShortfall: number;
  walletAfter: number;
  planCreditsAfter: number;
}

/**
 * Load wallet + subscription for a user
 */
export async function loadWalletAndSubscription(uid: string) {
  const walletRef = db.collection("wallets").doc(uid);
  const subRef = db.collection("subscriptions").doc(uid);

  const [walletSnap, subSnap] = await Promise.all([
    walletRef.get(),
    subRef.get(),
  ]);

  const wallet = walletSnap.exists
    ? walletSnap.data()!
    : {
        balanceTZS: 0,
        escrow: 0,
        credits: { callSeconds: 0 },
        currency: "TZS",
      };

  const subscription = subSnap.exists
    ? subSnap.data()!
    : {
        active: false,
        planId: "free",
        callCredits: 0,
      };

  return { walletRef, subRef, wallet, subscription };
}

/**
 * Charge a user for seconds of a call, respecting:
 *  1) Subscription callCredits (seconds)
 *  2) Then wallet balance (TZS) according to TZS_PER_CALL_CREDIT
 */
export async function chargeCallUsage(
  uid: string,
  mode: CallMode,
  seconds: number
): Promise<ChargeResult> {
  const { walletRef, subRef, wallet, subscription } =
    await loadWalletAndSubscription(uid);

  const perSecondCredits =
    mode === "video" ? VIDEO_CREDITS_PER_SECOND : AUDIO_CREDITS_PER_SECOND;

  const requiredCredits = seconds * perSecondCredits;

  let remainingCredits = requiredCredits;
  let chargedFromPlan = 0;
  let chargedFromWalletTZS = 0;

  // 1) Use subscription callCredits first
  let planCredits = Number(subscription.callCredits || 0);
  if (subscription.active && planCredits > 0) {
    const usedFromPlan = Math.min(planCredits, remainingCredits);
    planCredits -= usedFromPlan;
    remainingCredits -= usedFromPlan;
    chargedFromPlan = usedFromPlan;
  }

  // 2) Use wallet TZS if still remaining
  let walletBalance = Number(wallet.balanceTZS || 0);
  if (remainingCredits > 0 && walletBalance > 0) {
    const costTZS = remainingCredits * TZS_PER_CALL_CREDIT;

    if (walletBalance >= costTZS) {
      walletBalance -= costTZS;
      chargedFromWalletTZS = costTZS;
      remainingCredits = 0;
    } else {
      // Not enough to cover full – spend all, still short
      chargedFromWalletTZS = walletBalance;
      const coveredCredits = Math.floor(walletBalance / TZS_PER_CALL_CREDIT);
      remainingCredits -= coveredCredits;
      walletBalance = 0;
    }
  }

  // Persist updated wallet + subscription
  await Promise.all([
    walletRef.set(
      {
        balanceTZS: walletBalance,
        credits: {
          ...(wallet.credits || {}),
          callSeconds: (wallet.credits?.callSeconds || 0) - chargedFromPlan,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
    subRef.set(
      {
        callCredits: planCredits,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  return {
    chargedFromPlanCredits: chargedFromPlan,
    chargedFromWalletTZS: chargedFromWalletTZS,
    remainingCreditShortfall: remainingCredits,
    walletAfter: walletBalance,
    planCreditsAfter: planCredits,
  };
}

/**
 * Create a transaction record
 */
export async function createTransaction(params: {
  uid: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: any;
}) {
  const txRef = db.collection("transactions").doc();
  await txRef.set({
    uid: params.uid,
    type: params.type,
    amount: params.amount,
    currency: params.currency,
    description: params.description,
    metadata: params.metadata || {},
    participants: [params.uid],
    status: "completed",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return txRef.id;
}

/**
 * Simple helper to decide if we should warn: low wallet or low plan
 */
export function evaluateBalanceStatus(result: ChargeResult) {
  const lowWallet =
    result.walletAfter > 0 && result.walletAfter <= LOW_WALLET_THRESHOLD_TZS;
  const depletedWallet = result.walletAfter <= 0;

  const lowPlan =
    result.planCreditsAfter > 0 &&
    result.planCreditsAfter <= LOW_PLAN_THRESHOLD_SECONDS;
  const depletedPlan = result.planCreditsAfter <= 0;

  const outOfFunds =
    result.remainingCreditShortfall > 0 &&
    result.walletAfter <= 0 &&
    result.planCreditsAfter <= 0;

  return { lowWallet, depletedWallet, lowPlan, depletedPlan, outOfFunds };
}
