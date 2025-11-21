// functions/src/calls/createCallToken.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
  logger.warn(
    "⚠️ AGORA_APP_ID or AGORA_APP_CERTIFICATE is not set in environment. " +
      "Set them using Firebase Functions env or secrets."
  );
}

/**
 * Callable: createCallToken
 * Input: { channelName: string, role?: 'host' | 'audience', expireSeconds?: number }
 * Uses current Firebase Auth user uid as Agora userAccount.
 */
export const createCallToken = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      throw new HttpsError(
        "failed-precondition",
        "Agora environment variables not configured."
      );
    }

    const { channelName, role = "host", expireSeconds = 60 * 60 } =
      request.data || {};

    if (!channelName || typeof channelName !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "channelName is required (string)."
      );
    }

    const agoraRole =
      role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expireTimestamp = currentTimestamp + expireSeconds;

    const userAccount = request.auth.uid;

    try {
      const token = RtcTokenBuilder.buildTokenWithAccount(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channelName,
        userAccount,
        agoraRole,
        expireTimestamp
      );

      logger.info("✅ Agora token created", {
        channelName,
        uid: userAccount,
        role,
      });

      return {
        appId: AGORA_APP_ID,
        channelName,
        token,
        uid: userAccount,
        role,
        expireAt: expireTimestamp,
      };
    } catch (err: any) {
      logger.error("❌ Failed to create Agora token", err);
      throw new HttpsError(
        "internal",
        "Failed to generate Agora token: " + err.message
      );
    }
  }
);
