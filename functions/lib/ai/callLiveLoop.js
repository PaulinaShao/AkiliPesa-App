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
exports.callLiveLoop = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const openai = __importStar(require("./adapters/openai"));
const elevenlabs = __importStar(require("./adapters/elevenlabs"));
const db = admin.firestore();
exports.callLiveLoop = (0, https_1.onCall)(async (req) => {
    if (!req.auth)
        throw new Error("Unauthenticated");
    const { uid } = req.auth;
    const { callId, transcript, voiceId = null, persona = "empathetic" } = req.data || {};
    if (!callId || !transcript)
        throw new Error("Missing callId or transcript");
    // 1) LLM response (OpenAI)
    const llm = await openai.chat({
        system: `You are AkiliPesa AI. Persona: ${persona}. Be concise, caring, highly intelligent.`,
        user: transcript
    });
    if (llm.error) {
        console.error("LLM Error in callLiveLoop:", llm.error);
        throw new Error(llm.error);
    }
    const replyText = llm.text ?? "I’m here. Tell me more.";
    // 2) TTS (ElevenLabs; use cloned voice if provided)
    const tts = await elevenlabs.speak({
        text: replyText,
        voiceId // null uses default
    });
    if (tts.error) {
        console.error("TTS Error in callLiveLoop:", tts.error);
        // We can still return the text even if TTS fails
    }
    // 3) Log to call transcript
    const transRef = db.collection("calls").doc(callId).collection("transcripts").doc();
    await transRef.set({
        uid,
        role: "assistant",
        text: replyText,
        audioUrl: tts.outputUrl || null,
        created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    return { text: replyText, audioUrl: tts.outputUrl || null };
});
//# sourceMappingURL=callLiveLoop.js.map