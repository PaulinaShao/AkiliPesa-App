
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const AGORA_APP_CERT = process.env.AGORA_APP_CERT!;

export function createAgoraToken(uid: string, channelName: string) {
  if (!AGORA_APP_ID || !AGORA_APP_CERT) {
    throw new Error('Agora App ID or Certificate is not configured in environment variables.');
  }
  const expire = Math.floor(Date.now() / 1000) + 3600;
  return RtcTokenBuilder.buildTokenWithAccount(
    AGORA_APP_ID,
    AGORA_APP_CERT,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    expire
  );
}

export async function publishAudioToAgora(channelName: string, audio: Buffer) {
  console.log(`📡 (Stub) Sending audio to Agora: ${channelName} (${audio.length} bytes)`);
  // Later — plug Agora media relay or server audio injector
}
