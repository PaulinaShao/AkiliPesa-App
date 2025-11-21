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
exports.schedulePublisher2 = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * schedulePublisher2
 * HTTP endpoint that publishes scheduledPosts -> posts where publishAt <= now.
 */
exports.schedulePublisher2 = (0, https_1.onRequest)(async (_req, res) => {
    try {
        const now = admin.firestore.Timestamp.now();
        const scheduledSnap = await db
            .collection("scheduledPosts")
            .where("publishAt", "<=", now)
            .where("status", "==", "pending")
            .limit(50)
            .get();
        const batch = db.batch();
        scheduledSnap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const postRef = db.collection("posts").doc();
            batch.set(postRef, {
                ...data,
                id: postRef.id,
                status: "published",
                createdAt: now,
            });
            batch.update(docSnap.ref, {
                status: "published",
                publishedPostId: postRef.id,
                publishedAt: now,
            });
        });
        await batch.commit();
        res
            .status(200)
            .send(`Published ${scheduledSnap.size} scheduled posts to feed.`);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to publish scheduled posts.");
    }
});
//# sourceMappingURL=scheduler.js.map