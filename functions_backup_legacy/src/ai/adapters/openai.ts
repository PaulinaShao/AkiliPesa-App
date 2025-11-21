// functions/src/ai/adapters/openai.ts
import { OPENAI_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

const OAI_BASE = "https://api.openai.com/v1";

function auth() {
  return {
    Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Original helper: simple chat with system + user prompt.
 * Returns plain string text.
 */
export async function oaiChat(
  prompt: string,
  system = "You are AkiliPesa AI: warm, supportive, and concise.",
  model = "gpt-4o-mini"
): Promise<string> {
  const r = await fetch(`${OAI_BASE}/chat/completions`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const j = await r.json();
  return (j as any).choices?.[0]?.message?.content || "";
}

/**
 * DALL·E 3 text-to-image – unchanged
 */
export async function oaiImage(
  prompt: string,
  size: "1024x1024" | "512x512" = "1024x1024"
): Promise<string> {
  const r = await fetch(`${OAI_BASE}/images/generations`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });
  const j = await r.json();
  return (j as any).data?.[0]?.b64_json as string; // base64 PNG
}

/**
 * TTS (Voice back to user) – unchanged
 */
export async function oaiTTS(text: string): Promise<Buffer> {
  const r = await fetch(`${OAI_BASE}/audio/speech`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({
      model: "tts-1",
      voice: "alloy", // or 'nova', 'luna'
      input: text,
      response_format: "mp3",
    }),
  });
  const buf = Buffer.from(await r.arrayBuffer());
  return buf; // mp3
}

/**
 * NEW: chat() – what callLiveLoop.ts expects
 * Returns { text, error? }
 */
export async function chat(params: {
  system?: string;
  user: string;
  model?: string;
}): Promise<{ text: string; error?: string }> {
  try {
    const text = await oaiChat(
      params.user,
      params.system,
      params.model ?? "gpt-4o-mini"
    );
    return { text };
  } catch (e: any) {
    console.error("openai.chat failed:", e);
    return { text: "", error: e?.message || "openai_chat_failed" };
  }
}

/**
 * NEW: run() – what adapters/selector.ts expects
 * Very generic wrapper around oaiChat.
 */
export async function run(payload: any): Promise<any> {
  const prompt =
    payload?.prompt ??
    payload?.text ??
    (typeof payload === "string"
      ? payload
      : JSON.stringify(payload || {}));

  try {
    const text = await oaiChat(prompt);
    return {
      output: text,
      provider: "openai",
    };
  } catch (e: any) {
    console.error("openai.run failed:", e);
    return {
      output: null,
      error: e?.message || "openai_run_failed",
      provider: "openai",
    };
  }
}
