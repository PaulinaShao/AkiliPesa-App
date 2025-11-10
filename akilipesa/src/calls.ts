
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { RtcTokenBuilder, RtcRole } from "agora-token";
import { nanoid } from "nanoid";

const db = admin.firestore();

// Environment variables must be set in your Firebase project settings
const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const AGORA_APP_CERT = process.env.AGORA_APP_CERT!;

export const callSessionHandler = onCall(async (req) => {
  if (!req.auth) throw new Error("Unauthenticated");
  const { uid } = req.auth;
  const { agentId, mode = 'audio', roomType = 'meeting' } = req.data;

  const callId = nanoid();
  const channelName = `akili_${callId}`;

  const defaultLayouts: Record<string, string> = {
    classroom: 'grid',
    meeting: 'spotlight',
    live: 'speaker',
  };

  const callRoomData = {
    hostId: uid,
    channelName,
    mode,
    roomType,
    layoutMode: defaultLayouts[roomType] || 'spotlight',
    participants: [{ uid, role: 'host', joinedAt: admin.firestore.FieldValue.serverTimestamp(), muted: false, cameraOn: mode === 'video' }],
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    endedAt: null,
  };

  await db.collection('callRooms').doc(callId).set(callRoomData);

  const token = RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID, AGORA_APP_CERT, channelName, 0, RtcRole.PUBLISHER, 3600, 3600);

  return { appId: AGORA_APP_ID, token, channelName, callId };
});

export const joinExistingCall = onCall(async (req) => {
    if (!req.auth) throw new Error("Unauthenticated");
    const { uid } = req.auth;
    const { callId } = req.data;

    const callRoomRef = db.collection('callRooms').doc(callId);
    const callRoomSnap = await callRoomRef.get();

    if (!callRoomSnap.exists) throw new Error("Call room not found");
    const callRoom = callRoomSnap.data()!;

    if (!callRoom.participants.some((p: any) => p.uid === uid)) {
        await callRoomRef.update({
            participants: admin.firestore.FieldValue.arrayUnion({
                uid, role: 'guest', joinedAt: admin.firestore.FieldValue.serverTimestamp(), muted: false, cameraOn: callRoom.mode === 'video'
            })
        });
    }
    
    const token = RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID, AGORA_APP_CERT, callRoom.channelName, 0, RtcRole.PUBLISHER, 3600, 3600);
    return { appId: AGORA_APP_ID, token, channelName: callRoom.channelName, callId };
});

export const inviteToCall = onCall(async (req) => {
    if (!req.auth) throw new Error("Unauthenticated");
    const { callId, calleeId } = req.data;
    const inviterId = req.auth.uid;
    
    await db.collection('callInvites').add({
        callId, inviterId, calleeId, createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
});

export const updateLayoutMode = onCall(async (req) => {
    if (!req.auth) throw new Error("Unauthenticated");
    const { callId, layoutMode } = req.data;

    const callRoomRef = db.collection('callRooms').doc(callId);
    await callRoomRef.update({ layoutMode });

    return { success: true };
});

export const endCallRoom = onCall(async (req) => {
    if (!req.auth) throw new Error("Unauthenticated");
    const { callId } = req.data;
    
    const callRoomRef = db.collection('callRooms').doc(callId);
    await callRoomRef.update({ endedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Transactional logic for payouts will be handled by a separate trigger on write
    return { success: true };
});
