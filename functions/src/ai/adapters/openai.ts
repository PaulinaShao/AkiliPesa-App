//-------------------------------------------------------
// OPENAI ADAPTER (FIXED TO MATCH AiResponse + AiVendor)
//-------------------------------------------------------

import { OPENAI_API_KEY } from "../../config/secrets.js";
import type { AiResponse, AiRequest } from "./types.js";
import fetch from "node-fetch";

// ---------------- TEXT --------------------
export async function openaiText(prompt: string): Promise<AiResponse> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data: any = await res.json();

  return {
    type: "text",
    text: data.choices?.[0]?.message?.content || "",
  };
}

// ---------------- IMAGE --------------------
export async function openaiImage(prompt: string): Promise<AiResponse> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
    }),
  });

  const data: any = await res.json();

  return {
    type: "image",
    url: data.data?.[0]?.url || "",
  };
}

// ----------------- TTS ---------------------
export async function openaiTTS(text: string): Promise<AiResponse> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "alloy",
      response_format: "mp3",
    }),
  });

  const buffer = Buffer.from(await res.arrayBuffer());

  return {
    type: "audio",
    buffer,
  };
}

// ----------------- VENDOR --------------------
export const openAiVendor = {
  name: "openai",
  supports: ["text", "image", "tts", "audio"],
  cost: 1,

  async handle(request: AiRequest): Promise<AiResponse> {
    if (request.mode === "text") return openaiText(request.prompt || "");
    if (request.mode === "image") return openaiImage(request.prompt || "");
    if (request.mode === "tts") return openaiTTS(request.text || "");

    throw new Error("Unsupported mode for OpenAI vendor");
  },
};
