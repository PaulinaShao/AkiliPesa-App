// functions/src/finance/realtimePayoutManager.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Cron: check for payoutRequests that are approved and not yet processed.
 * For now it only logs; later you connect DPO / Flutterwave etc.
 */
export const realtimePayoutManager = onSchedule(
  {
    schedule: "every 15 minutes",
    region: "us-central1",
  },
  async () => {
    const snap = await db
      .collection("payoutRequests")
      .where("status", "==", "approved")
      .where("processed", "==", false)
      .limit(50)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.forEach((doc) => {
      batch.update(doc.ref, {
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
  }
);
