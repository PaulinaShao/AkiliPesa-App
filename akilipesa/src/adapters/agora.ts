import { AGORA_APP_ID, AGORA_APP_CERT } from "../config/secrets";
import { onCall } from "firebase-functions/v2/https";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

export const getAgoraToken = onCall({ secrets: [AGORA_APP_ID, AGORA_APP_CERT] }, async (req) => {
  const channelName = req.data?.channelName || `akili_${Date.now()}`;
  const expire = 3600;
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID.value(), AGORA_APP_CERT.value(), channelName, 0, RtcRole.PUBLISHER, expire
  );
  return { appId: AGORA_APP_ID.value(), channelName, token };
});
