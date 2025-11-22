import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../firebase/index.js";

export const inviteToCall = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign-in required.");

    const { callId, inviteeId } = request.data || {};
    if (!callId || !inviteeId) {
      throw new HttpsError(
        "invalid-argument",
        "callId and inviteeId are required."
      );
    }

    const callRef = db.collection("callSessions").doc(callId);
    const snap = await callRef.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Call session not found.");
    }

    await callRef.collection("invites").doc(inviteeId).set({
      inviteeId,
      invitedBy: auth.uid,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true };
  }
);
