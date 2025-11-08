// Minimal client helper to fetch an RTC token from your callable function
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

export async function getRtcToken(params: {
  channel: string;
  uid: string;              // Firebase Auth UID
  role?: "publisher" | "subscriber";
  ttlSeconds?: number;
}) {
  const fn = httpsCallable(getFunctions(getApp()), "createRtcToken");
  const res = await fn(params);
  // Expected response: { token, appId, channel, uid, expireAt }
  return res.data as {
    token: string;
    appId: string;
    channel: string;
    uid: string;
    expireAt: number;
  };
}
