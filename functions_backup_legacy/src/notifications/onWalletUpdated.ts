// functions/src/notifications/onWalletUpdated.ts
import * as admin from "firebase-admin";
import { NotificationPayload } from "./notifications";

type WalletDoc = {
  balanceTZS?: number;
  escrow?: number;
  plan?: { id?: string; credits?: number };
};

const LOW_BALANCE_THRESHOLD = 2000; // TZS
const LOW_CREDITS_THRESHOLD = 20;

/**
 * Build notifications based on wallet changes.
 * Called from dispatcher.ts trigger.
 */
export function buildWalletNotifications(
  uid: string,
  before: admin.firestore.DocumentData | undefined,
  after: admin.firestore.DocumentData | undefined
): NotificationPayload[] {
  const notifications: NotificationPayload[] = [];
  if (!after) return notifications;

  const beforeWallet: WalletDoc = (before || {}) as any;
  const afterWallet: WalletDoc = (after || {}) as any;

  const prevBalance = Number(beforeWallet.balanceTZS || 0);
  const newBalance = Number(afterWallet.balanceTZS || 0);

  const prevCredits = Number(beforeWallet.plan?.credits || 0);
  const newCredits = Number(afterWallet.plan?.credits || 0);

  // Wallet balance crossing thresholds
  if (newBalance === 0 && prevBalance > 0) {
    notifications.push({
      userId: uid,
      type: "WALLET_DEPLETED",
      title: "Your AkiliPesa wallet is empty",
      body: "Top up now to continue calls and purchases.",
      channels: { inApp: true, push: true, email: false },
    });
  } else if (
    newBalance > 0 &&
    newBalance <= LOW_BALANCE_THRESHOLD &&
    prevBalance > LOW_BALANCE_THRESHOLD
  ) {
    notifications.push({
      userId: uid,
      type: "LOW_WALLET_BALANCE",
      title: "Low wallet balance",
      body: `Your wallet is below TZS ${LOW_BALANCE_THRESHOLD.toLocaleString(
        "en-US"
      )}. Please top up.`,
      channels: { inApp: true, push: true, email: false },
    });
  }

  // Plan credits thresholds
  if (prevCredits > 0 && newCredits === 0) {
    notifications.push({
      userId: uid,
      type: "PLAN_DEPLETED",
      title: "Your plan is depleted",
      body: "You have used all your plan credits. Buy a new plan to continue.",
      channels: { inApp: true, push: true, email: false },
    });
  } else if (
    newCredits > 0 &&
    newCredits <= LOW_CREDITS_THRESHOLD &&
    prevCredits > LOW_CREDITS_THRESHOLD
  ) {
    notifications.push({
      userId: uid,
      type: "LOW_PLAN_CREDITS",
      title: "Low plan credits",
      body: "Your plan credits are almost finished. Consider upgrading.",
      channels: { inApp: true, push: true, email: false },
    });
  }

  return notifications;
}
