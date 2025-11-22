// functions/src/ai/endAiCall.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase";
export const endAiCall = onCall({ region: "us-central1" }, async (request) => {
    const auth = request.auth;
    if (!auth) {
        throw new HttpsError("unauthenticated", "Sign-in required.");
    }
    const { aiCallId, reason = "ended_by_user" } = request.data || {};
    if (!aiCallId) {
        throw new HttpsError("invalid-argument", "aiCallId is required.");
    }
    const ref = db.collection("aiCallSessions").doc(aiCallId);
    const snap = await ref.get();
    if (!snap.exists) {
        throw new HttpsError("not-found", "AI call session not found.");
    }
    const data = snap.data() || {};
    const startedAt = data.startedAt || null;
    const now = admin.firestore.FieldValue.serverTimestamp();
    let durationSec = null;
    if (startedAt) {
        const startDate = startedAt.toDate();
        const diffMs = Date.now() - startDate.getTime();
        durationSec = Math.round(diffMs / 1000);
    }
    await ref.set({
        status: "ended",
        endedAt: now,
        endReason: reason,
        durationSec,
        updatedAt: now,
    }, { merge: true });
    return {
        ok: true,
        aiCallId,
        status: "ended",
        durationSec,
    };
});
