// functions/src/notifications/dispatcher.ts
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import {
  createNotification,
  NotificationPayload,
} from "./notifications";
import { buildWalletNotifications } from "./onWalletUpdated";
import { buildTransactionNotifications } from "./onTransactionCreated";

const db = admin.firestore();

/**
 * Trigger: wallet changes ⇒ notifications (low balance, etc.)
 */
export const onWalletUpdated = onDocumentWritten("wallets/{uid}", async (event) => {
  const uid = event.params.uid as string;

  const before = event.data?.before.data();
  const after = event.data?.after.data();

  const payloads: NotificationPayload[] = buildWalletNotifications(
    uid,
    before || undefined,
    after || undefined
  );

  for (const p of payloads) {
    await createNotification(p);
  }
});

/**
 * Trigger: new transaction ⇒ notifications (topup, transfer, commission)
 */
export const onTransactionCreated = onDocumentCreated(
  "transactions/{txId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const payloads = buildTransactionNotifications(snap as any);
    for (const p of payloads) {
      await createNotification(p);
    }
  }
);

/**
 * Optional queue processor:
 * If you ever want to push items into /notificationQueue,
 * this will flush them into /notifications.
 */
export const dispatchQueuedNotifications = onDocumentCreated(
  "notificationQueue/{id}",
  async (event) => {
    const data = event.data?.data() as NotificationPayload | undefined;
    if (!data) return;

    await createNotification(data);

    // Mark as processed
    await event.data?.ref.update({
      processed: true,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);
