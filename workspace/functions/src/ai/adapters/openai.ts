import fetch from "node-fetch";
import { OPENAI_API_KEY } from "../../config/secrets.js";
import { AIResult } from "./types.js";

const OAI_BASE = "https://api.openai.com/v1";

function openaiHeaders() {
  return {
    Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
    "Content-Type": "application/json",
  };
}

export async function openaiText(prompt: string): Promise<AIResult> {
  const res = await fetch(`${OAI_BASE}/chat/completions`, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are AkiliPesa AI, Tanzanian, warm, practical and concise.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const json: any = await res.json();
  const text = json.choices?.[0]?.message?.content || "";

  return {
    vendor: "openai",
    mode: "text",
    type: "text",
    text,
    meta: json,
  };
}

export async function openaiImage(prompt: string): Promise<AIResult> {
  const res = await fetch(`${OAI_BASE}/images/generations`, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  const json: any = await res.json();
  const base64 = json.data?.[0]?.b64_json as string;

  return {
    vendor: "openai",
    mode: "image",
    type: "image",
    base64,
    meta: json,
  };
}

export async function openaiTTS(text: string): Promise<AIResult> {
  const res = await fetch(`${OAI_BASE}/audio/speech`, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: "tts-1",
      voice: "alloy",
      input: text,
      response_format: "mp3",
    }),
  });

  const buf = Buffer.from(await res.arrayBuffer());
  const base64 = buf.toString("base64");

  return {
    vendor: "openai",
    mode: "tts",
    type: "audio",
    base64,
  };
}
