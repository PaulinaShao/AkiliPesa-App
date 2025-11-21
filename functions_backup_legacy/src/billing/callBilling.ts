import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  chargeCallUsage,
  evaluateBalanceStatus,
  CallMode,
  createTransaction,
} from "../wallet/walletEngine";
import { createNotification } from "../notifications/notifications";

const db = admin.firestore();

/**
 * Scheduled function: runs every minute (adjust in console if you want)
 * For all active callSessions, bills from lastBilledAt → now.
 */
export const callBillingTick = onSchedule("every 1 minutes", async (event) => {
  const now = admin.firestore.Timestamp.now();

  const snap = await db
    .collection("callSessions")
    .where("status", "==", "active")
    .get();

  if (snap.empty) {
    console.log("No active callSessions to bill.");
    return;
  }

  console.log(`Billing ${snap.size} active sessions...`);

  const promises: Promise<any>[] = [];

  snap.forEach((docSnap) => {
    const sessionId = docSnap.id;
    const data = docSnap.data();

    const callerId: string = data.callerId;
    const mode: CallMode = data.mode === "video" ? "video" : "audio";
    const startedAt: admin.firestore.Timestamp = data.startedAt;
    const lastBilledAt: admin.firestore.Timestamp | null =
      data.lastBilledAt || null;

    const from = lastBilledAt || startedAt;
    const seconds =
      (now.toMillis() - from.toMillis()) > 0
        ? Math.floor((now.toMillis() - from.toMillis()) / 1000)
        : 0;

    if (!callerId || seconds <= 0) {
      return;
    }

    promises.push(
      (async () => {
        console.log(
          `Billing session ${sessionId} for ${seconds}s, caller=${callerId}, mode=${mode}`
        );

        const result = await chargeCallUsage(callerId, mode, seconds);

        // record a transaction for wallet debit (if any)
        if (result.chargedFromWalletTZS > 0) {
          await createTransaction({
            uid: callerId,
            type: "callDebit",
            amount: -Math.abs(result.chargedFromWalletTZS),
            currency: "TZS",
            description: `Call billing (${mode})`,
            metadata: { sessionId, seconds },
          });
        }

        // Update session's lastBilledAt + totalBilledSeconds
        await docSnap.ref.set(
          {
            lastBilledAt: now,
            totalBilledSeconds:
              (data.totalBilledSeconds || 0) + seconds,
            updatedAt: now,
          },
          { merge: true }
        );

        // Evaluate balance + send notifications
        const status = evaluateBalanceStatus(result);

        if (status.lowWallet) {
          await createNotification({
            userId: callerId,
            type: "LOW_WALLET_BALANCE",
            title: "Low wallet balance",
            body: "Your AkiliPesa wallet balance is running low. Top up to avoid call interruptions.",
            data: { sessionId },
          });
        }

        if (status.lowPlan) {
          await createNotification({
            userId: callerId,
            type: "LOW_PLAN_CREDITS",
            title: "Low plan credits",
            body: "Your plan credits are almost finished. Consider upgrading your package.",
            data: { sessionId },
          });
        }

        if (status.outOfFunds) {
          // Mark session as ending and notify user
          await docSnap.ref.set(
            {
              status: "ending",
              endReason: "insufficient_funds",
              updatedAt: now,
            },
            { merge: true }
          );

          await createNotification({
            userId: callerId,
            type: "CALL_ENDED_NO_FUNDS",
            title: "Call stopped – insufficient balance",
            body: "Your call was stopped because your plan credits and wallet balance are depleted.",
            data: { sessionId },
          });
        }
      })()
    );
  });

  await Promise.all(promises);
  console.log("✅ callBillingTick completed.");
});
