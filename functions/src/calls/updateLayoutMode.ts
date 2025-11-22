import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase.js";

/**
 * updateLayoutMode
 * Host changes callRooms/{callId}.layoutMode
 */
export const updateLayoutMode = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { callId, layoutMode } = request.data as {
    callId?: string;
    layoutMode?: string;
  };

  if (!callId || !layoutMode) {
    throw new HttpsError("invalid-argument", "callId and layoutMode required.");
  }

  if (!["grid", "spotlight", "speaker"].includes(layoutMode)) {
    throw new HttpsError("invalid-argument", "Unsupported layout mode.");
  }

  const roomRef = db.collection("callRooms").doc(callId);
  const snap = await roomRef.get();
  if (!snap.exists) throw new HttpsError("not-found", "Call room not found.");

  const data = snap.data()!;
  if (data.hostId !== uid) {
    throw new HttpsError("permission-denied", "Only host can change layout.");
  }

  await roomRef.set(
    {
      layoutMode,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});
