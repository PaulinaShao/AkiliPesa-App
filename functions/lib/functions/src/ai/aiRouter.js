// functions/src/ai/aiRouter.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { OPENAI_API_KEY } from "../config/secrets";
import { db } from "../firebase";
import { selectVendor } from "./adapters/selector";
export const aiRouter = onCall({ region: "us-central1", secrets: [OPENAI_API_KEY] }, async (request) => {
    const auth = request.auth;
    if (!auth) {
        throw new HttpsError("unauthenticated", "Sign-in required.");
    }
    const { mode = "chat", prompt, vendor, extra } = request.data || {};
    if (!prompt || typeof prompt !== "string") {
        throw new HttpsError("invalid-argument", "'prompt' is required.");
    }
    const uid = auth.uid;
    const aiRequest = {
        mode,
        prompt,
        userId: uid,
        extra: extra || {},
    };
    const chosenVendor = selectVendor(mode, vendor);
    const result = await chosenVendor.handle(aiRequest);
    const logRef = db.collection("aiLogs").doc();
    await logRef.set({
        id: logRef.id,
        uid,
        vendor: result.vendor,
        mode: result.mode,
        prompt,
        type: result.type,
        createdAt: new Date(),
    });
    return result;
});
