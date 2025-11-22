import { onCall } from "firebase-functions/v2/https";
import { openaiText } from "./adapters/openai.js";

export const callLiveLoop = onCall(
  { region: "us-central1" },
  async (req) => {
    const { transcript, persona } = req.data || {};

    const replyResult = await openaiText(
      `You are AkiliPesa AI in a live call. Persona: ${
        persona || "warm"
      }.\nUser said: ${transcript}`
    );

    return {
      ok: true,
      text: replyResult.text,
    };
  }
);
