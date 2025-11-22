import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase/index.js";

/**
 * joinExistingCall
 * Adds the caller as participant in callRooms/{callId}.
 */
export const joinExistingCall = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { callId } = request.data as { callId?: string };
  if (!callId) {
    throw new HttpsError("invalid-argument", "callId is required.");
  }

  const roomRef = db.collection("callRooms").doc(callId);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) {
    throw new HttpsError("not-found", "Call room not found.");
  }

  const data = roomSnap.data() || {};
  const participants = data.participants || {};

  participants[uid] = {
    ...(participants[uid] || {}),
    role: participants[uid]?.role ?? "guest",
    joined: true,
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await roomRef.set(
    {
      participants,
      status: "live",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});
