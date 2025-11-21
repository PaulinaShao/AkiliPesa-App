/**
 * Hybrid Real-Time Billing for Calls + Smart Notifications
 *
 * - HTTP function: callBillingTick
 *   Called every N seconds by the client.
 *   Charges 1 credit/sec for audio, 3 credits/sec for video.
 *   Uses plan.credits first, then wallet.balanceTZS.
 *   If there’s not enough balance → mark call as `ended_insufficient_funds`
 *   and send a "Top up / Buy plan" notification with recommended package.
 *
 * - Firestore trigger: onCallRoomWrite
 *   When call status changes from active → ended,
 *   creates a single transactions record and updates agent earnings
 *   including revenue share fields.
 */

import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

const db = admin.firestore();

// ─────────────────────────────────────────────
// PRICING & THRESHOLDS
// ─────────────────────────────────────────────

// Per-second credit cost
const AUDIO_RATE_CREDITS_PER_SEC = 1;
const VIDEO_RATE_CREDITS_PER_SEC = 3;

// Mapping credits → TZS (simple for now)
const CREDIT_VALUE_TZS = 1;

// Revenue share on call revenue
const PLATFORM_SHARE = 0.2; // 20% AkiliPesa, 80% to agent

// Thresholds to trigger "low balance" warnings
const LOW_PLAN_CREDITS_THRESHOLD = 20;
const LOW_WALLET_TZS_THRESHOLD = 2000;

// ─────────────────────────────────────────────
// HELPERS: Recommendation + Notifications
// ─────────────────────────────────────────────

type RecommendedPlan = {
  id: string;
  name: string;
  credits: number;
  priceTZS: number;
  description: string;
};

/**
 * Simple hard-coded recommended plan.
 * Later you can swap this to read from a `plans` or `subscriptionsConfig` collection.
 */
function getRecommendedPlan(): RecommendedPlan {
  return {
    id: "starter_call_pack",
    name: "Starter Call Pack",
    credits: 600, // e.g. 10 minutes video (3 credits/s) or 10 mins+ audio mix
    priceTZS: 6000,
    description: "Best value for short audio/video sessions.",
  };
}

/**
 * Creates a notification document for the user.
 * This can be rendered:
 *  - in the notifications screen
 *  - as a feed-style card (placement: 'feed')
 *  - or in banners (placement: 'banner')
 */
async function createTopupNotification(params: {
  uid: string;
  type: "INSUFFICIENT_FUNDS" | "LOW_BALANCE" | "BALANCE_DEPLETED";
  currentPlanCredits: number;
  currentWalletTZS: number;
  callId?: string;
}) {
  const { uid, type, currentPlanCredits, currentWalletTZS, callId } = params;
  const recommendedPlan = getRecommendedPlan();

  const messages: Record<string, { title: string; body: string }> = {
    INSUFFICIENT_FUNDS: {
      title: "Your call ended - top up to continue",
      body: "Your balance ran out during a call. Top up your wallet or buy a call pack to keep enjoying AkiliPesa calls.",
    },
    LOW_BALANCE: {
      title: "Your balance is running low",
      body: "Your wallet or plan credits are getting low. Top up now so your next call doesn’t get interrupted.",
    },
    BALANCE_DEPLETED: {
      title: "Your balance is depleted",
      body: "Your plan credits or wallet balance reached zero. Recharge now to continue using premium features.",
    },
  };

  const { title, body } = messages[type];

  const notifRef = db.collection("notifications").doc();
  await notifRef.set({
    id: notifRef.id,
    userId: uid,
    type,
    title,
    message: body,
    callId: callId || null,
    placement: ["feed", "inbox"], // UI can treat as "feed card" like Instagram + notifications tab
    ctaType: "TOP_UP_OR_BUY_PLAN",
    recommendedPlan: {
      id: recommendedPlan.id,
      name: recommendedPlan.name,
      description: recommendedPlan.description,
      credits: recommendedPlan.credits,
      priceTZS: recommendedPlan.priceTZS,
    },
    currentBalances: {
      planCredits: currentPlanCredits,
      walletTZS: currentWalletTZS,
    },
    status: "unread",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// HTTP: Tick-Based Billing Function
// ─────────────────────────────────────────────

export const callBillingTick = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const { callId } = req.body;
    if (!callId || typeof callId !== "string") {
      res.status(400).json({ error: "callId required" });
      return;
    }

    try {
      const result = await db.runTransaction(async (tx) => {
        const callRef = db.collection("callRooms").doc(callId);
        const callSnap = await tx.get(callRef);

        if (!callSnap.exists) {
          return { status: "not_found", chargedSeconds: 0 } as any;
        }

        const call = callSnap.data() as any;

        // If call is no longer active, nothing to charge
        if (call.status && call.status !== "active") {
          return {
            status: "ended",
            chargedSeconds: 0,
          } as any;
        }

        const now = admin.firestore.Timestamp.now();
        const startedAt: admin.firestore.Timestamp | null =
          call.startedAt || null;
        const lastBilledAt: admin.firestore.Timestamp | null =
          call.lastBilledAt || startedAt;

        if (!lastBilledAt) {
          // First time – just stamp lastBilledAt, no charge
          tx.update(callRef, {
            lastBilledAt: now,
            status: "active",
          });
          return {
            status: "initialized",
            chargedSeconds: 0,
          } as any;
        }

        const elapsedSec = Math.floor(
          (now.toMillis() - lastBilledAt.toMillis()) / 1000
        );

        if (elapsedSec <= 0) {
          tx.update(callRef, { lastBilledAt: now });
          return {
            status: "noop",
            chargedSeconds: 0,
          } as any;
        }

        const mode = call.mode === "video" ? "video" : "audio";
        const rate =
          mode === "video"
            ? VIDEO_RATE_CREDITS_PER_SEC
            : AUDIO_RATE_CREDITS_PER_SEC;

        const requiredCredits = elapsedSec * rate;

        // Who is paying?
        const billingUid =
          call.billingUid ||
          call.callerId ||
          call.customerId ||
          call.hostId;
        const agentId = call.agentId || call.hostId || null;

        if (!billingUid) {
          // We can't safely charge without knowing the payer
          tx.update(callRef, { lastBilledAt: now });
          return {
            status: "missing_billing_uid",
            chargedSeconds: 0,
          } as any;
        }

        const walletRef = db.collection("wallets").doc(billingUid);
        const walletSnap = await tx.get(walletRef);
        const wallet = (walletSnap.exists ? walletSnap.data() : {}) as any;

        const beforePlanCredits: number = wallet?.plan?.credits || 0;
        const beforeWalletTZS: number = wallet?.balanceTZS || 0;

        let planCredits = beforePlanCredits;
        let walletBalanceTZS = beforeWalletTZS;

        let remaining = requiredCredits;
        let planUsed = 0;
        let walletCreditsUsed = 0;

        // 1) Use plan credits first
        if (planCredits > 0) {
          planUsed = Math.min(planCredits, remaining);
          planCredits -= planUsed;
          remaining -= planUsed;
        }

        // 2) Then use wallet balance (converted to credits)
        if (remaining > 0 && walletBalanceTZS > 0) {
          const walletCreditsAvailable = Math.floor(
            walletBalanceTZS / CREDIT_VALUE_TZS
          );
          const fromWallet = Math.min(walletCreditsAvailable, remaining);
          walletCreditsUsed = fromWallet;
          walletBalanceTZS -= fromWallet * CREDIT_VALUE_TZS;
          remaining -= fromWallet;
        }

        // Flags to drive notifications:
        let notificationType:
          | "INSUFFICIENT_FUNDS"
          | "LOW_BALANCE"
          | "BALANCE_DEPLETED"
          | null = null;

        // 3) If still remaining -> end call for insufficient funds
        let newStatus = call.status || "active";
        if (remaining > 0) {
          newStatus = "ended_insufficient_funds";
          notificationType = "INSUFFICIENT_FUNDS";
        } else {
          // Only trigger low/depleted notifications when we successfully charged
          const afterPlanCredits = planCredits;
          const afterWalletTZS = walletBalanceTZS;

          const planWentLow =
            beforePlanCredits >= LOW_PLAN_CREDITS_THRESHOLD &&
            afterPlanCredits < LOW_PLAN_CREDITS_THRESHOLD;

          const walletWentLow =
            beforeWalletTZS >= LOW_WALLET_TZS_THRESHOLD &&
            afterWalletTZS < LOW_WALLET_TZS_THRESHOLD;

          const anyDepleted =
            (beforePlanCredits > 0 && afterPlanCredits === 0) ||
            (beforeWalletTZS > 0 && afterWalletTZS === 0);

          if (anyDepleted) {
            notificationType = "BALANCE_DEPLETED";
          } else if (planWentLow || walletWentLow) {
            notificationType = "LOW_BALANCE";
          }
        }

        // Update callRoom aggregate fields
        tx.update(callRef, {
          lastBilledAt: now,
          status: newStatus,
          totalSecondsBilled: (call.totalSecondsBilled || 0) + elapsedSec,
          totalCreditsRequired:
            (call.totalCreditsRequired || 0) + requiredCredits,
          endedAt:
            newStatus !== "active"
              ? admin.firestore.FieldValue.serverTimestamp()
              : call.endedAt || null,
        });

        // Update wallet (plan + balance)
        tx.set(
          walletRef,
          {
            balanceTZS: walletBalanceTZS,
            plan: {
              ...(wallet.plan || {}),
              credits: planCredits,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // Aggregate usage into realtimeBilling/{callId}
        const billingRef = db.collection("realtimeBilling").doc(callId);
        tx.set(
          billingRef,
          {
            callId,
            billingUid,
            agentId,
            mode,
            audioSeconds:
              mode === "audio"
                ? admin.firestore.FieldValue.increment(elapsedSec)
                : admin.firestore.FieldValue.increment(0),
            videoSeconds:
              mode === "video"
                ? admin.firestore.FieldValue.increment(elapsedSec)
                : admin.firestore.FieldValue.increment(0),
            planCreditsUsed:
              planUsed > 0
                ? admin.firestore.FieldValue.increment(planUsed)
                : admin.firestore.FieldValue.increment(0),
            walletDebitTZS:
              walletCreditsUsed > 0
                ? admin.firestore.FieldValue.increment(
                    walletCreditsUsed * CREDIT_VALUE_TZS
                  )
                : admin.firestore.FieldValue.increment(0),
            lastTickAt: now,
          },
          { merge: true }
        );

        return {
          status: newStatus,
          chargedSeconds: elapsedSec,
          planUsed,
          walletDebitTZS: walletCreditsUsed * CREDIT_VALUE_TZS,
          billingUid,
          notificationType,
          currentPlanCredits: planCredits,
          currentWalletTZS: walletBalanceTZS,
        };
      });

      // OUTSIDE the transaction: create notifications if needed
      if (
        result.billingUid &&
        result.notificationType &&
        (result.notificationType === "INSUFFICIENT_FUNDS" ||
          result.notificationType === "LOW_BALANCE" ||
          result.notificationType === "BALANCE_DEPLETED")
      ) {
        await createTopupNotification({
          uid: result.billingUid,
          type: result.notificationType,
          currentPlanCredits: result.currentPlanCredits ?? 0,
          currentWalletTZS: result.currentWalletTZS ?? 0,
          callId,
        });
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("callBillingTick error:", err);
      res.status(500).json({ error: "internal" });
    }
  }
);

// ─────────────────────────────────────────────
// Firestore Trigger: Finalize Call Billing
// ─────────────────────────────────────────────

export const onCallRoomWrite = onDocumentWritten(
  { region: "us-central1", document: "callRooms/{callId}" },
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;
    if (!before || !after) return;

    const prev = before.data() as any;
    const cur = after.data() as any;
    if (!prev || !cur) return;

    const prevStatus = prev.status || "unknown";
    const newStatus = cur.status || "unknown";

    // Only act when going from active → non-active
    if (
      prevStatus === "active" &&
      newStatus !== "active" &&
      newStatus !== "ringing"
    ) {
      const callId = event.params.callId;
      const billingSnap = await db
        .collection("realtimeBilling")
        .doc(callId)
        .get();

      if (!billingSnap.exists) {
        console.log(`No billing record for call ${callId}, skipping.`);
        return;
      }

      const billing = billingSnap.data() as any;
      const billingUid =
        billing.billingUid ||
        cur.billingUid ||
        cur.callerId ||
        cur.customerId;
      const agentId = billing.agentId || cur.agentId || cur.hostId || null;

      if (!billingUid) {
        console.log(`No billingUid for call ${callId}, skipping.`);
        return;
      }

      const audioSeconds = billing.audioSeconds || 0;
      const videoSeconds = billing.videoSeconds || 0;
      const walletDebitTZS = billing.walletDebitTZS || 0;
      const totalSeconds = audioSeconds + videoSeconds;

      const modeLabel = cur.mode || (videoSeconds > 0 ? "video" : "audio");

      // Revenue share
      const grossAmount = walletDebitTZS;
      const platformShareTZS = Math.round(grossAmount * PLATFORM_SHARE);
      const agentShareTZS = grossAmount - platformShareTZS;

      // Create a single transaction entry
      const txRef = db.collection("transactions").doc();
      await txRef.set({
        id: txRef.id,
        type: "call",
        callId,
        uid: billingUid,
        agentId,
        amount: grossAmount,
        currency: "TZS",
        description: `${modeLabel} call – ${totalSeconds}s`,
        status: "completed",
        participants: [billingUid, agentId].filter(Boolean),
        revenue: {
          grossAmountTZS: grossAmount,
          platformShareTZS,
          agentShareTZS,
          taxTZS: 0, // later you can compute VAT/WHT and fill here
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update agent earnings (simple revenue share)
      if (agentId && agentShareTZS > 0) {
        await db
          .collection("agentEarnings")
          .doc(agentId)
          .set(
            {
              totalEarned: admin.firestore.FieldValue.increment(agentShareTZS),
              totalGross: admin.firestore.FieldValue.increment(grossAmount),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      }

      // OPTIONAL: monthly revenueReports aggregation can be added here later.

      console.log(
        `✅ Finalized billing for call ${callId} (status: ${newStatus}) – gross: ${grossAmount}, platform: ${platformShareTZS}, agent: ${agentShareTZS}`
      );
    }
  }
);
