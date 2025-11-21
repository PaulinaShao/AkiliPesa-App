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
exports.createAiCallSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * createAiCallSession
 * Creates a Firestore aiSessions document for an AI voice/chat session.
 * Collection: aiSessions/{sessionId}
 */
exports.createAiCallSession = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    const { agentId = "akilipesa-ai", mode = "chat", initialMessage = "" } = request.data ?? {};
    if (!["chat", "audio", "video"].includes(mode)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid session mode.");
    }
    const sessionRef = db.collection("aiSessions").doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    await sessionRef.set({
        sessionId: sessionRef.id,
        userId: uid,
        agentId,
        mode,
        isActive: true,
        createdAt: now,
        lastUpdated: now,
        lastMessage: initialMessage ?? "",
        meta: {
            source: "createAiCallSession",
            version: 1,
        },
    });
    return {
        sessionId: sessionRef.id,
    };
});
//# sourceMappingURL=createAiCallSession.js.map