// functions/src/ai/callLiveLoop.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { openAiVendor } from "./adapters/openai.js";

export const callLiveLoop = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    const { transcript, persona } = request.data || {};

    if (!transcript || typeof transcript !== "string") {
      throw new HttpsError("invalid-argument", "'transcript' is required.");
    }

    const prompt = `You are AkiliPesa AI in a live call. Persona: ${
      persona || "warm"
    }.\nUser said: ${transcript}`;

    const result = await openAiVendor.handle({
      mode: "chat",
      prompt,
      userId: auth.uid,
      extra: {
        persona: persona || "warm",
        source: "callLiveLoop",
      },
    });

    return {
      ok: true,
      text: result.text ?? "",
    };
  }
);
