
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import * as admin from "firebase-admin";
import { onUpdate, onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { computeCallCost } from "./lib/callPricing";
import { onBookingRequestCreate, onBookingStatusChange, onCallInvite } from "./notifications";
import { onBookingStatusCreateIcs } from "./ics";
import { callSessionHandler, joinExistingCall, inviteToCall, updateLayoutMode, endCallRoom } from "./calls";


if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

// --- Core AI & Call Flows ---
export { createAiCallSession } from "./ai/createAiCallSession";
export { callSessionHandler, enqueueTTS } from "./ai/callSessionHandler";
export { callLiveLoop } from "./ai/callLiveLoop";
export { endAiCall } from "./ai/endAiCall";
export { summarizeAiSession } from "./ai/summarizeSession";
export { onBookingStatusCreateIcs } from "./ics";

// --- New Real-time Call Functions ---
export { joinExistingCall, inviteToCall, updateLayoutMode, endCallRoom };


// --- Original AI Router & Adapters ---
export { aiRouter, pollVideoJob, createRtcToken } from "./ai/aiRouter";
export { getAgoraToken } from "./adapters/agora";


export const expireMissedCalls = onUpdate("callInvites/{callId}", async (change) => {
    const after = change.after.data();
    if (after.status === "ringing" && change.after.createTime.toMillis() < Date.now() - 30000) {
      await admin.firestore().collection("callHistory").doc(change.after.id).set({
        status: "missed"
      }, { merge: true });
       await change.after.ref.delete();
    }
});


export const onCallComplete = onDocumentWritten("callHistory/{callId}", async (event) => {
    const snap = event.data;
    if (!snap) return;

    const before = snap.before.data();
    const after = snap.after.data();

    // Trigger on transition from ongoing to a final state
    if (before?.status === 'ongoing' && ['completed', 'missed', 'declined'].includes(after?.status)) {
        const { callerId, receiverId, startedAt, endedAt } = after;
        const durationSeconds = endedAt.toMillis() - startedAt.toMillis();
        
        // 1. Calculate Cost
        const { cost, commission } = computeCallCost(durationSeconds);

        // 2. Create Transaction
        const txRef = db.collection('transactions').doc(event.params.callId);
        await txRef.set({
            uid: callerId,
            type: 'deduction',
            description: `Call with ${receiverId}`,
            amount: -cost,
            currency: 'credits',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 3. Update Wallets
        const callerWalletRef = db.collection('users').doc(callerId);
        const receiverWalletRef = db.collection('users').doc(receiverId);

        const batch = db.batch();
        batch.update(callerWalletRef, { 'wallet.balance': admin.firestore.FieldValue.increment(-cost) });
        batch.update(receiverWalletRef, { 'wallet.balance': admin.firestore.FieldValue.increment(commission) });
        
        await batch.commit();
        
        // 4. Update agent availability
        await db.collection('agentAvailability').doc(receiverId).set({ busy: false }, { merge: true });
    }
});

// --- Notification Triggers ---
export { onBookingRequestCreate, onBookingStatusChange, onCallInvite };
