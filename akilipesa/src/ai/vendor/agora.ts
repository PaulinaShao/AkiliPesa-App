
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const TOKEN_EXPIRATION_IN_SECONDS = 3600; // 1 hour

/**
 * Builds Agora RTC tokens for both a user and an AI agent.
 * @param channelName The name of the channel they will join.
 * @returns An object containing tokens for the user and the AI.
 */
export function buildTokens(channelName: string) {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERT;

  if (!appId || !appCertificate) {
    throw new Error("AGORA_APP_ID and AGORA_APP_CERT must be set in environment variables.");
  }

  const userToken = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    0, // UID for the user (0 allows Agora to assign one)
    RtcRole.PUBLISHER,
    TOKEN_EXPIRATION_IN_SECONDS
  );

  const aiToken = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    1, // A static, non-zero UID for the AI agent
    RtcRole.PUBLISHER,
    TOKEN_EXPIRATION_IN_SECONDS
  );

  return { userToken, aiToken };
}
