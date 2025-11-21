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
exports.uploadVoice = void 0;
// functions/src/uploads/uploadVoice.ts
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * uploadVoice
 * Registers metadata for a voice file uploaded to Firebase Storage.
 * Frontend uploads the binary separately via SDK.
 */
exports.uploadVoice = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    const { storagePath, durationSec = 0 } = request.data;
    if (!storagePath) {
        throw new https_1.HttpsError("invalid-argument", "storagePath is required.");
    }
    const ref = db.collection("voiceUploads").doc();
    await ref.set({
        id: ref.id,
        userId: uid,
        storagePath,
        durationSec,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: ref.id };
});
//# sourceMappingURL=uploadVoice.js.map