// functions/src/notifications/notifications.ts
import * as admin from "firebase-admin";

const db = admin.firestore();

export type NotificationChannel = "inapp" | "push" | "email";

export interface NotificationChannelsFlags {
  inApp?: boolean;
  push?: boolean;
  email?: boolean;
}

export interface NotificationPayload {
  userId: string;
  type:
    | "LOW_WALLET_BALANCE"
    | "WALLET_DEPLETED"
    | "LOW_PLAN_CREDITS"
    | "PLAN_DEPLETED"
    | "CALL_ENDED_NO_FUNDS"
    | "COMMISSION_EARNED"
    | "NEW_OFFER"
    | "RECOMMENDED_PRODUCT"
    | "RECOMMENDED_SERVICE"
    | "TOPUP_SUCCESS"
    | "PLAN_PURCHASED"
    | "TRANSFER_RECEIVED"
    | "TRANSFER_SENT";
  title: string;
  body: string;
  data?: any;
  channels?: NotificationChannelsFlags;
}

/**
 * Generic creator – writes to /notifications.
 * Later you can fan this out to FCM & email.
 */
export async function createNotification(payload: NotificationPayload) {
  const ref = db.collection("notifications").doc();
  await ref.set({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    channels: payload.channels || { inApp: true, push: true, email: false },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
