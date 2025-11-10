"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulePublisher = exports.socialPoster = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function postInstagram({ accessToken, igUserId, caption, mediaUrl }) {
    // Instagram's API requires a two-step process for video/image posting.
    // 1) Create a media container
    const containerUrl = `https://graph.facebook.com/v20.0/${igUserId}/media`;
    const containerParams = new URLSearchParams({
        access_token: accessToken,
        caption: caption,
        // Use image_url for images, video_url for videos
        [mediaUrl.includes('.mp4') ? 'video_url' : 'image_url']: mediaUrl,
    });
    const cRes = await fetch(`${containerUrl}?${containerParams.toString()}`, { method: "POST" });
    const cData = await cRes.json();
    if (!cData?.id)
        throw new Error(`Failed to create Instagram media container: ${JSON.stringify(cData)}`);
    const creationId = cData.id;
    // 2) Poll until the container is ready
    let containerStatus = 'IN_PROGRESS';
    while (containerStatus === 'IN_PROGRESS') {
        await new Promise(r => setTimeout(r, 3000));
        const statusUrl = `https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${accessToken}`;
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();
        containerStatus = statusData.status_code;
        if (containerStatus === 'ERROR')
            throw new Error('Instagram media container failed to process.');
    }
    // 3) Publish the media container
    const publishUrl = `https://graph.facebook.com/v20.0/${igUserId}/media_publish`;
    const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
    });
    const pRes = await fetch(`${publishUrl}?${publishParams.toString()}`, { method: "POST" });
    const pData = await pRes.json();
    if (!pData?.id)
        throw new Error(`Failed to publish Instagram media: ${JSON.stringify(pData)}`);
    return { postId: pData.id };
}
// TODO: Add functions for TikTok, YouTube, X, LinkedIn, etc. following similar patterns.
exports.socialPoster = (0, https_1.onCall)(async (req) => {
    if (!req.auth)
        throw new Error("Unauthenticated");
    const { uid } = req.auth;
    const { platform, caption, mediaUrl, scheduled_at = null, extra = {} } = req.data || {};
    if (!platform || !mediaUrl)
        throw new Error("Missing platform or mediaUrl");
    // enqueue or post immediately
    if (scheduled_at) {
        const ref = db.collection("social_posts").doc();
        await ref.set({
            uid, platform, caption, mediaUrl, scheduled_at,
            status: "queued", created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        return { queued: true, id: ref.id };
    }
    let result = {};
    try {
        if (platform === "instagram") {
            const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
            if (!accessToken)
                throw new Error("Instagram access token is not configured.");
            const igUserId = extra.igUserId; // The user's Instagram User ID is required
            if (!igUserId)
                throw new Error("Instagram User ID (`igUserId`) is required in `extra` options.");
            result = await postInstagram({ accessToken, igUserId, caption, mediaUrl });
        }
        else {
            // TODO: add TikTok/YouTube/X/LinkedIn specifics here or route to per-platform adapters.
            throw new Error("Platform not yet wired for immediate posting. Please use scheduling.");
        }
        return { ok: true, result };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
exports.schedulePublisher = (0, https_1.onCall)(async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection("social_posts")
        .where("status", "==", "queued")
        .where("scheduled_at", "<=", now)
        .get();
    if (snap.empty) {
        return { ok: true, published: 0 };
    }
    const publishPromises = snap.docs.map(async (doc) => {
        const post = doc.data();
        try {
            if (post.platform === "instagram") {
                const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
                if (!accessToken)
                    throw new Error("Instagram access token is not configured.");
                const igUserId = post.extra?.igUserId;
                if (!igUserId)
                    throw new Error("Instagram User ID is missing from scheduled post.");
                const res = await postInstagram({
                    accessToken,
                    igUserId,
                    caption: post.caption || "",
                    mediaUrl: post.mediaUrl
                });
                await doc.ref.update({ status: "success", result_url: `https://instagram.com/p/${res.postId || ""}` });
            }
            else {
                await doc.ref.update({ status: "failed", error: "Platform not implemented" });
            }
        }
        catch (e) {
            await doc.ref.update({ status: "failed", error: e.message });
        }
    });
    await Promise.all(publishPromises);
    return { ok: true, published: snap.size };
});
//# sourceMappingURL=socialPoster.js.map