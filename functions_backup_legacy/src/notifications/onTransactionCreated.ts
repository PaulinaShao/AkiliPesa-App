// functions/src/notifications/onTransactionCreated.ts
import * as admin from "firebase-admin";
import { NotificationPayload } from "./notifications";

export function buildTransactionNotifications(
  snap: admin.firestore.QueryDocumentSnapshot
): NotificationPayload[] {
  const tx = snap.data() as any;
  const uid: string = tx.uid;
  const type: string = tx.type || "transaction";
  const amount: number = Number(tx.amount || 0);

  const notifications: NotificationPayload[] = [];

  const baseChannels = { inApp: true, push: true, email: false };

  switch (type) {
    case "topup":
      notifications.push({
        userId: uid,
        type: "TOPUP_SUCCESS",
        title: "Top-up successful",
        body: `You added TZS ${Math.abs(amount).toLocaleString(
          "en-US"
        )} to your wallet.`,
        data: { txId: snap.id, amount },
        channels: baseChannels,
      });
      break;

    case "plan_purchase":
      notifications.push({
        userId: uid,
        type: "PLAN_PURCHASED",
        title: "Subscription activated",
        body: "Your plan is now active. Enjoy your minutes and credits.",
        data: { txId: snap.id },
        channels: baseChannels,
      });
      break;

    case "commission_credit":
    case "Commission Credit":
      notifications.push({
        userId: uid,
        type: "COMMISSION_EARNED",
        title: "You earned a commission",
        body: `You earned TZS ${Math.abs(amount).toLocaleString(
          "en-US"
        )} from a sale.`,
        data: { txId: snap.id, amount },
        channels: baseChannels,
      });
      break;

    case "transfer_credit":
      notifications.push({
        userId: uid,
        type: "TRANSFER_RECEIVED",
        title: "Money received",
        body: `You received TZS ${Math.abs(amount).toLocaleString(
          "en-US"
        )} to your wallet.`,
        data: { txId: snap.id, amount },
        channels: baseChannels,
      });
      break;

    case "transfer_debit":
      notifications.push({
        userId: uid,
        type: "TRANSFER_SENT",
        title: "Money sent",
        body: `You sent TZS ${Math.abs(amount).toLocaleString(
          "en-US"
        )} from your wallet.`,
        data: { txId: snap.id, amount },
        channels: baseChannels,
      });
      break;

    default:
      // other types handled by wallet notifications
      break;
  }

  return notifications;
}
