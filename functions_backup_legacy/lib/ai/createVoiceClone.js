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
exports.createVoiceClone = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const elevenlabs = __importStar(require("./adapters/elevenlabs"));
const runpod = __importStar(require("./adapters/runpod"));
const db = admin.firestore();
exports.createVoiceClone = (0, https_1.onCall)(async (req) => {
    if (!req.auth)
        throw new Error("Unauthenticated");
    const { uid } = req.auth;
    const { audioBase64, voiceName, vendor = "elevenlabs" } = req.data || {};
    if (!audioBase64 || !voiceName)
        throw new Error("Missing audioBase64 or voiceName");
    let result;
    if (vendor === "elevenlabs") {
        result = await elevenlabs.clone({ audioBase64, voiceName });
    }
    else {
        result = await runpod.cloneVoice({ audioBase64, voiceName });
    }
    if (result.error)
        throw new Error(result.error);
    const voiceId = result.voiceId;
    await db.collection("voices").doc(uid).collection("userVoices").doc(voiceId).set({
        voiceId, name: voiceName, vendor,
        created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    return { voiceId };
});
//# sourceMappingURL=createVoiceClone.js.map