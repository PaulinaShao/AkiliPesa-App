import { onCall } from "firebase-functions/v2/https";
import { db } from "../firebase.js";
import {
  RtcTokenBuilder,
  RtcRole
} from "agora-access-token";

export const createCallToken = onCall(async (request) => {
  try {
    const { channel, uid } = request.data;
    
    if (!channel || !uid) {
      throw new Error("Missing channel or uid");
    }

    const appId = process.env.AGORA_APP_ID;
    const appCert = process.env.AGORA_APP_CERT;

    if (!appId || !appCert) {
        throw new Error("Agora App ID or Certificate not configured in environment.");
    }

    const role = RtcRole.PUBLISHER;
    const expire = Math.floor(Date.now() / 1000) + 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCert,
      channel,
      uid,
      role,
      expire
    );

    return { token };
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
});
