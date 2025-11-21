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
exports.seeddemo = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * seeddemo
 * HTTP endpoint to quickly seed demo posts (admin only if you add checks).
 */
exports.seeddemo = (0, https_1.onRequest)(async (req, res) => {
    try {
        const postsRef = db.collection("posts");
        const batch = db.batch();
        const demoPosts = [
            {
                authorId: "demo-agent-1",
                caption: "Karibu AkiliPesa – AI + Commerce demo!",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                likesCount: 0,
                commentsCount: 0,
                type: "video",
            },
            {
                authorId: "demo-agent-2",
                caption: "Buy sunflower oil direct from farmers 🌻",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                likesCount: 0,
                commentsCount: 0,
                type: "image",
            },
        ];
        demoPosts.forEach((p) => {
            const ref = postsRef.doc();
            batch.set(ref, { id: ref.id, ...p });
        });
        await batch.commit();
        res.status(200).send("Seeded demo posts.");
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to seed demo posts.");
    }
});
//# sourceMappingURL=seeddemo.js.map