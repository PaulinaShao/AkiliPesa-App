import { onCall } from "firebase-functions/v2/https";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import * as admin from "firebase-admin";
const db = admin.firestore();
export const callSessionHandler = onCall(async (req) => {
    if (!req.auth)
        throw new Error("Unauthenticated");
    const { uid } = req.auth;
    const { mode = "video", calleeId = null, agentId = null, agentType = "ai" } = req.data || {};
    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERT = process.env.AGORA_APP_CERTIFICATE;
    if (!APP_ID || !APP_CERT)
        throw new Error("Agora credentials missing");
    const channelName = `akili_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
    const expire = 3600;
    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERT, channelName, 0, RtcRole.PUBLISHER, expire);
    const callRef = db.collection("calls").doc();
    await callRef.set({
        callId: callRef.id,
        channelName,
        callerId: uid,
        calleeId,
        agentId,
        agentType, // "ai" or "user"
        mode, // "audio" | "video"
        status: "active",
        pricePerSecondCredits: agentType === "ai" ? 0.08 : 0.12, // tweak by plan/agent
        startedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { token, channelName, callId: callRef.id, appId: APP_ID };
});
//# sourceMappingURL=callSessionHandler.js.map