import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase";
/**
 * endCallRoom
 * Host ends the call; status becomes 'ended'
 */
export const endCallRoom = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new HttpsError("unauthenticated", "Sign in required.");
    const { callId, reason = "host-ended" } = request.data;
    if (!callId) {
        throw new HttpsError("invalid-argument", "callId is required.");
    }
    const roomRef = db.collection("callRooms").doc(callId);
    const snap = await roomRef.get();
    if (!snap.exists)
        throw new HttpsError("not-found", "Call room not found.");
    const data = snap.data();
    if (data.hostId !== uid) {
        throw new HttpsError("permission-denied", "Only host can end the call.");
    }
    await roomRef.set({
        status: "ended",
        endReason: reason,
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true };
});
