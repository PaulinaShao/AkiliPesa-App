// functions/src/ai/adapters/openai.ts
import fetch from "node-fetch";
import { OPENAI_API_KEY } from "../../config/secrets";
import { AiVendor, AiRequest, AiResponse } from "./types";

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

  async handle(request: AiRequest): Promise<AiResponse> {
    const { mode, prompt } = request;

    if (mode === "chat") {
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
      const j = await r.json() as any;
      const text = j.choices?.[0]?.message?.content || "";
      return {
        ok: true,
        vendor: "openai",
        mode,
        type: "text",
        text,
        raw: j,
      };
    }

    if (mode === "image") {
      const r = await fetch(`${OAI_BASE}/images/generations`, {
        method: "POST",
        headers: oaiHeaders(),
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        }),
      });
      const j = await r.json() as any;
      const imageBase64 = j.data?.[0]?.b64_json as string;
      return {
        ok: true,
        vendor: "openai",
        mode,
        type: "image",
        imageBase64,
        raw: j,
      };
    }

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
      // In Phase 1 we just return as base64 audio
      const audioBase64 = buf.toString("base64");
      const dataUrl = `data:audio/mp3;base64,${audioBase64}`;
      return {
        ok: true,
        vendor: "openai",
        mode,
        type: "audio",
        audioUrl: dataUrl,
        raw: { base64Length: audioBase64.length },
      };
    }

    throw new Error(`OpenAI does not support mode ${mode}`);
  },
};
