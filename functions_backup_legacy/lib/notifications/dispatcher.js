"use strict";
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
exports.dispatchQueuedNotifications = exports.onTransactionCreated = exports.onWalletUpdated = void 0;
// functions/src/notifications/dispatcher.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("./notifications");
const onWalletUpdated_1 = require("./onWalletUpdated");
const onTransactionCreated_1 = require("./onTransactionCreated");
const db = admin.firestore();
/**
 * Trigger: wallet changes ⇒ notifications (low balance, etc.)
 */
exports.onWalletUpdated = (0, firestore_1.onDocumentWritten)("wallets/{uid}", async (event) => {
    const uid = event.params.uid;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const payloads = (0, onWalletUpdated_1.buildWalletNotifications)(uid, before || undefined, after || undefined);
    for (const p of payloads) {
        await (0, notifications_1.createNotification)(p);
    }
});
/**
 * Trigger: new transaction ⇒ notifications (topup, transfer, commission)
 */
exports.onTransactionCreated = (0, firestore_1.onDocumentCreated)("transactions/{txId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const payloads = (0, onTransactionCreated_1.buildTransactionNotifications)(snap);
    for (const p of payloads) {
        await (0, notifications_1.createNotification)(p);
    }
});
/**
 * Optional queue processor:
 * If you ever want to push items into /notificationQueue,
 * this will flush them into /notifications.
 */
exports.dispatchQueuedNotifications = (0, firestore_1.onDocumentCreated)("notificationQueue/{id}", async (event) => {
    const data = event.data?.data();
    if (!data)
        return;
    await (0, notifications_1.createNotification)(data);
    // Mark as processed
    await event.data?.ref.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
//# sourceMappingURL=dispatcher.js.map