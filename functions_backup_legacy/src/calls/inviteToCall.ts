import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * inviteToCall
 * Creates a callRooms doc + callInvites doc.
 */
export const inviteToCall = onCall(async (request) => {
  const callerId = request.auth?.uid;
  if (!callerId) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const {
    calleeId,
    mode = "audio",
    agentId = "akilipesa-ai",
  } = request.data as {
    calleeId?: string;
    mode?: "audio" | "video";
    agentId?: string;
  };

  if (!calleeId) {
    throw new HttpsError("invalid-argument", "calleeId is required.");
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const roomRef = db.collection("callRooms").doc();

  const roomData = {
    callId: roomRef.id,
    hostId: callerId,
    participants: {
      [callerId]: {
        role: "host",
        joined: false,
        muted: false,
        cameraOn: mode === "video",
      },
      [calleeId]: {
        role: "guest",
        joined: false,
        muted: false,
        cameraOn: mode === "video",
      },
    },
    mode,
    agentId,
    status: "invited",
    layoutMode: "grid",
    createdAt: now,
    updatedAt: now,
  };

  await roomRef.set(roomData);

  const inviteRef = db.collection("callInvites").doc();
  await inviteRef.set({
    inviteId: inviteRef.id,
    callId: roomRef.id,
    from: callerId,
    to: calleeId,
    mode,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return {
    callId: roomRef.id,
    inviteId: inviteRef.id,
  };
});
