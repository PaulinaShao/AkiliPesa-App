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
exports.createVoiceCloneV2 = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * createVoiceCloneV2
 * Enqueues a voice cloning job in voiceClones collection.
 */
exports.createVoiceCloneV2 = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    const { sampleUrl, text, model = "openvoice-v2" } = request.data;
    if (!sampleUrl || !text) {
        throw new https_1.HttpsError("invalid-argument", "sampleUrl and text are required.");
    }
    const ref = db.collection("voiceClones").doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.set({
        id: ref.id,
        userId: uid,
        sampleUrl,
        text,
        model,
        status: "queued", // to be processed by external worker
        createdAt: now,
        updatedAt: now,
    });
    return { jobId: ref.id };
});
//# sourceMappingURL=createVoiceCloneV2.js.map