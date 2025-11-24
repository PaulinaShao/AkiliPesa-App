// functions/src/ai/adapters/openai.ts
import fetch from "node-fetch";
import { OPENAI_API_KEY } from "../../config/secrets.js";
import { AiVendor, AiRequest, AiResponse } from "./types.js";

const OAI_BASE = "https://api.openai.com/v1";

function oaiHeaders() {
  return {
    Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
    "Content-Type": "application/json",
  };
}

export const openAiVendor: AiVendor = {
  name: "openai",
  supports: ["chat", "image", "tts"],
  cost: 0.5, // approx cost unit for vendorOptimizer / future logic

  async handle(request: AiRequest): Promise<AiResponse> {
    const { mode, prompt } = request;

    // ----------------- CHAT (text) -----------------
    if (mode === "chat" || mode === "text") {
      const r = await fetch(`${OAI_BASE}/chat/completions`, {
        method: "POST",
        headers: oaiHeaders(),
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are AkiliPesa AI: Tanzanian, warm, practical, and concise.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      const j = (await r.json()) as any;
      const text = j.choices?.[0]?.message?.content || "";

      return {
        type: "text",
        text,
        vendor: "openai",
        mode: "chat",
        meta: j,
      };
    }

    // ----------------- IMAGE GENERATION -----------------
    if (mode === "image") {
      const r = await fetch(`${OAI_BASE}/images/generations`, {
        method: "POST",
        headers: oaiHeaders(),
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      const j = (await r.json()) as any;
      const url = j.data?.[0]?.url || "";

      return {
        type: "image",
        url,
        vendor: "openai",
        mode: "image",
        meta: j,
      };
    }

    // ----------------- TTS (TEXT → AUDIO) -----------------
    if (mode === "tts") {
      const r = await fetch(`${OAI_BASE}/audio/speech`, {
        method: "POST",
        headers: oaiHeaders(),
        body: JSON.stringify({
          model: "tts-1",
          voice: "alloy",
          input: prompt,
          response_format: "mp3",
        }),
      });

      const buf = Buffer.from(await r.arrayBuffer());

      return {
        type: "audio",
        buffer: buf,
        vendor: "openai",
        mode: "tts",
        meta: { byteLength: buf.byteLength },
      };
    }

    // For now, other modes are not implemented for OpenAI
    throw new Error(`OpenAI does not support mode ${mode}`);
  },
};
