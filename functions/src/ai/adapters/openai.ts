//----------------------------------------------
// OPENAI ADAPTER — FULL EXPORT-SAFE VERSION
//----------------------------------------------

import { OPENAI_API_KEY } from "../../config/secrets.js";
import type { AiResponse } from "./types.js";
import fetch from "node-fetch";

// ----------------------------------------------
// TEXT GENERATION
// ----------------------------------------------
export async function openaiText(prompt: string): Promise<AiResponse> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  return {
    type: "text",
    output: (data as any).choices?.[0]?.message?.content || "",
  };
}

// ----------------------------------------------
// IMAGE GENERATION
// ----------------------------------------------
export async function openaiImage(prompt: string): Promise<AiResponse> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
    }),
  });

  const data = await res.json();
  return {
    type: "image",
    output: (data as any).data?.[0]?.url || "",
  };
}

// ----------------------------------------------
// TTS GENERATION
// ----------------------------------------------
export async function openaiTTS(text: string): Promise<AiResponse> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
    output: buffer,
  };
}

// ----------------------------------------------
// OPENAI VENDOR DEFINITION
// ----------------------------------------------
export const openAiVendor = {
  name: "openai",
  supports: ["text", "image", "audio", "tts", "multi"],
  cost: 1,
  runText: openaiText,
  runImage: openaiImage,
  runTTS: openaiTTS,
};
