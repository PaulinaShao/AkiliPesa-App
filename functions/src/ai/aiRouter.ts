// ------------------------------------------------------------
// AI ROUTER — FINAL FIXED VERSION
// ------------------------------------------------------------

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { OPENAI_API_KEY } from "../config/secrets.js";
import { db } from "../firebase.js";

import { AiRequest } from "./adapters/types.js";
import { selectVendor } from "./adapters/selector.js";

// ------------------------------------------------------------
// MAIN ROUTER
// ------------------------------------------------------------
export const aiRouter = onCall(
  { region: "us-central1", secrets: [OPENAI_API_KEY] },
  async (request) => {

    // --------------------------
    // AUTH CHECK
    // --------------------------
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    // --------------------------
    // INPUT
    // --------------------------
    const { mode = "chat", prompt, vendor, extra } = request.data || {};

    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError("invalid-argument", "'prompt' must be a string.");
    }

    // --------------------------
    // FINAL AiRequest (matches types.ts)
    // --------------------------
    const aiRequest: AiRequest = {
      mode,
      prompt,
      userId: auth.uid,
      extra: extra || {}
    };

    // --------------------------
    // SELECT VENDOR (OpenAI default)
    // --------------------------
    const chosenVendor = selectVendor(mode, vendor);

    // --------------------------
    // RUN VENDOR HANDLER
    // --------------------------
    const result = await chosenVendor.handle(aiRequest);

    // --------------------------
    // LOG RESULT
    // --------------------------
    const logRef = db.collection("aiLogs").doc();

    await logRef.set({
      id: logRef.id,
      uid: auth.uid,
      vendor: result.vendor,
      mode: result.mode,
      prompt,
      type: result.type,
      createdAt: new Date(),
    });

    return result;
  }
);
