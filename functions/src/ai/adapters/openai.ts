import { OPENAI_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

const OAI_BASE = "https://api.openai.com/v1";

function auth() {
  return { Authorization: `Bearer ${OPENAI_API_KEY.value()}`, "Content-Type": "application/json" };
}

export async function oaiChat(prompt: string, system = "You are AkiliPesa AI: warm, supportive, and concise.") {
  const r = await fetch(`${OAI_BASE}/chat/completions`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      temperature: 0.7
    })
  });
  const j = await r.json();
  return (j as any).choices?.[0]?.message?.content || "";
}

// DALL·E 3 text-to-image
export async function oaiImage(prompt: string, size: "1024x1024"|"512x512"="1024x1024") {
  const r = await fetch(`${OAI_BASE}/images/generations`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size, response_format: "b64_json" })
  });
  const j = await r.json();
  return (j as any).data?.[0]?.b64_json as string; // base64 PNG
}

// TTS (Voice back to user)
export async function oaiTTS(text: string) {
  const r = await fetch(`${OAI_BASE}/audio/speech`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({
      model: "tts-1",
      voice: "alloy", // or 'nova', 'luna'
      input: text,
      response_format: "mp3"
    })
  });
  const buf = Buffer.from(await r.arrayBuffer());
  return buf; // mp3
}
