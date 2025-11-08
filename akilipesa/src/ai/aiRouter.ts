import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { OPENAI_API_KEY, STABILITY_API_KEY, RUNWAY_API_KEY, LUMA_API_KEY } from "../config/secrets";
import { oaiChat, oaiImage } from "../adapters/openai";
import { sdxlImage } from "../adapters/stability";
import { runwayCreateVideo, runwayGetTask } from "../adapters/runway";
import { lumaCreateVideo, lumaGetJob } from "../adapters/luma";
import { pickImageVendor, pickVideoVendor } from "./vendorOptimizer";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage().bucket();

export const aiRouter = onCall(
  { secrets: [OPENAI_API_KEY, STABILITY_API_KEY, RUNWAY_API_KEY, LUMA_API_KEY] },
  async (req) => {
    const { task, prompt, plan = "pro", wallet = 10 } = req.data as { task: "text"|"image"|"video", prompt: string, plan?: "free"|"pro"|"vip", wallet?: number };
    const uid = req.auth?.uid || "anon";

    if (!prompt || !task) throw new Error("Missing prompt or task");

    if (task === "text") {
      const text = await oaiChat(prompt);
      await db.collection("ai_requests").add({ uid, task, prompt, output: text, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return { type: "text", text };
    }

    if (task === "image") {
      const pick = pickImageVendor(plan, wallet);
      const b64 = pick.vendor === "openai" ? await oaiImage(prompt, pick.size) : await sdxlImage(prompt);
      const buf = Buffer.from(b64, "base64");
      const fname = `ai-outputs/${uid}/${Date.now()}.png`;
      const f = storage.file(fname);
      await f.save(buf, { contentType: "image/png", resumable: false });
      const [url] = await f.getSignedUrl({ action: "read", expires: "03-09-2999" });
      await db.collection("ai_requests").add({ uid, task, prompt, vendor: pick.vendor, url, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return { type: "image", url, vendor: pick.vendor };
    }

    if (task === "video") {
      const pick = pickVideoVendor(plan, wallet);
      if (pick.vendor === "runway") {
        const job = await runwayCreateVideo(prompt);
        return { type: "video_job", vendor: "runway", id: (job as any).id };
      } else {
        const job = await lumaCreateVideo(prompt);
        return { type: "video_job", vendor: "luma", id: (job as any).job_id };
      }
    }

    throw new Error("Unsupported task");
  }
);

// Optional poll endpoints could also be exposed as callable if you want the client to poll:
export const pollVideoJob = onCall({ secrets: [RUNWAY_API_KEY, LUMA_API_KEY] }, async (req) => {
  const { vendor, id } = req.data as { vendor: "runway"|"luma", id: string };
  if (vendor === "runway") return await runwayGetTask(id);
  return await lumaGetJob(id);
});

function buildRtcToken(channel: string, uid: string, role: "publisher" | "subscriber" = "publisher", ttlSeconds = 3600) {
    const APP_ID = process.env.AGORA_APP_ID!;
    const APP_CERT = process.env.AGORA_APP_CERT!;
    const roleMap = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expire = Math.floor(Date.now() / 1000) + ttlSeconds;
    const token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERT, channel, uid, roleMap, expire);
    return { token, appId: APP_ID, expireAt: expire };
}

/** Callable: createRtcToken */
export const createRtcToken = onCall({secrets: ["AGORA_APP_ID", "AGORA_APP_CERT"]}, async (req) => {
  const auth = req.auth;
  if (!auth) throw new Error("Unauthenticated");
  const { channel, role = "publisher", ttlSeconds = 3600 } = req.data as { channel: string; role?: "publisher"|"subscriber"; ttlSeconds?: number; };

  if (!channel) throw new Error("Missing channel");
  const { token, appId, expireAt } = buildRtcToken(channel, auth.uid, role, ttlSeconds);

  // (Optional) record for audits
  await db.collection("callTokens").add({
    uid: auth.uid, channel, role, issuedAt: admin.firestore.FieldValue.serverTimestamp(), expireAt,
  });

  return { token, appId, channel, uid: auth.uid, expireAt };
});
