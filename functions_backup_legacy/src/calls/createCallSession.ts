// functions/src/calls/createCallSession.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const db = admin.firestore();

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
  logger.warn(
    "⚠️ AGORA_APP_ID or AGORA_APP_CERTIFICATE is not set in environment."
  );
}

type CallMode = "audio" | "video";

interface CreateCallSessionRequest {
  agentId: string;
  mode: CallMode;
}

/**
 * Callable: createCallSession
 * Input: { agentId: string, mode: 'audio' | 'video' }
 * Output: { callId, channelName, token, appId, uid, mode }
 */
export const createCallSession = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      throw new HttpsError(
        "failed-precondition",
        "Agora environment variables are not configured."
      );
    }

    const data = request.data as CreateCallSessionRequest;
    const callerId = request.auth.uid;

    if (!data?.agentId || typeof data.agentId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "agentId (string) is required."
      );
    }

    if (!["audio", "video"].includes(data.mode)) {
      throw new HttpsError(
        "invalid-argument",
        "mode must be 'audio' or 'video'."
      );
    }

    const mode = data.mode as CallMode;
    const calleeId = data.agentId;

    try {
      // ─────────────────────────────
      // 1) Create Firestore callSessions doc
      // ─────────────────────────────
      const sessionRef = db.collection("callSessions").doc();

      const channelName = `call_${sessionRef.id}`;

      const participants: Record<
        string,
        { role: "caller" | "callee"; joined: boolean }
      > = {
        [callerId]: { role: "caller", joined: false },
        [calleeId]: { role: "callee", joined: false },
      };

      await sessionRef.set({
        id: sessionRef.id,
        channelName,
        mode,
        callerId,
        calleeId,
        participants,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending", // pending → active → ended
        layoutMode: "grid",
        billing: {
          perSecondRate: mode === "audio" ? 1 : 3, // credits/sec (your rule)
          startedAt: null,
          endedAt: null,
          totalBilledSeconds: 0,
        },
      });

      // ─────────────────────────────
      // 2) Generate Agora token for caller (host)
      // ─────────────────────────────
      const agoraRole = RtcRole.PUBLISHER;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expireTimestamp = currentTimestamp + 60 * 60; // 1 hour

      const userAccount = callerId;

      const token = RtcTokenBuilder.buildTokenWithAccount(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channelName,
        userAccount,
        agoraRole,
        expireTimestamp
      );

      logger.info("✅ Created callSession + Agora token", {
        callId: sessionRef.id,
        channelName,
        mode,
        callerId,
        calleeId,
      });

      return {
        callId: sessionRef.id,
        channelName,
        appId: AGORA_APP_ID,
        token,
        uid: callerId,
        mode,
        expireAt: expireTimestamp,
      };
    } catch (err: any) {
      logger.error("❌ Failed to create callSession", err);
      throw new HttpsError(
        "internal",
        "Failed to create call session: " + err.message
      );
    }
  }
);
