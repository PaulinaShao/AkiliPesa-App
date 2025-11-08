import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import * as admin from "firebase-admin";

const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const AGORA_APP_CERT = process.env.AGORA_APP_CERT!;

/**
 * Generate a token for a user to join an Agora voice/video call.
 * This is called from the client when user clicks "Start Call".
 */
export function createUserToken(
  uid: string,
  channelName: string,
  expireSeconds = 3600
) {
  if (!AGORA_APP_ID || !AGORA_APP_CERT) {
    throw new Error("Missing AGORA_APP_ID or AGORA_APP_CERT");
  }

  const role = RtcRole.PUBLISHER;
  const expireTs = Math.floor(Date.now() / 1000) + expireSeconds;

  return {
    appId: AGORA_APP_ID,
    token: RtcTokenBuilder.buildTokenWithAccount(
      AGORA_APP_ID,
      AGORA_APP_CERT,
      channelName,
      uid,
      role,
      expireTs,
    ),
    channelName,
  };
}

/**
 * Generate a token FOR AI (server-publisher)
 * AkiliPesa AI uses this token to speak inside the call.
 */
export function createAIToken(channelName: string, expireSeconds = 3600) {
  if (!AGORA_APP_ID || !AGORA_APP_CERT) {
    throw new Error("Missing AGORA_APP_ID or AGORA_APP_CERT");
  }

  const AI_UID = "akilipesa-ai"; // fixed unique identity for AI voice
  const role = RtcRole.PUBLISHER;
  const expireTs = Math.floor(Date.now() / 1000) + expireSeconds;

  return {
    appId: AGORA_APP_ID,
    token: RtcTokenBuilder.buildTokenWithAccount(
      AGORA_APP_ID,
      AGORA_APP_CERT,
      channelName,
      AI_UID,
      role,
      expireTs,
    ),
    channelName,
    aiUid: AI_UID,
  };
}

/**
 * Placeholder for server publishing audio into Agora channel.
 * This will connect to Agora Media Server OR Agora Interactive AI Gateway.
 */
export async function publishAudioToAgora(channelName: string, audioBuffer: Buffer) {
  // phase 1: placeholder — logs audio size
  console.log(`📡 (Stub) Publishing ${audioBuffer.length} bytes to "${channelName}"`);

  // phase 2: real media injection (we enable after front-end runs)
  // This is where the server will stream PCM -> Agora RTMP injection / RTSA stream.
}
