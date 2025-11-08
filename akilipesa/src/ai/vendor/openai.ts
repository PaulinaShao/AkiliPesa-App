
import fetch from "node-fetch";

const API_BASE = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

function getHeaders() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

const systemPrompt = `
You are AkiliPesa AI:

• You begin in warm Tanzanian Swahili.
• You naturally mix Swahili and English the way real Tanzanians do.
• You adapt your accent to match the user.
• You mirror emotional tone: calm ↔ energetic.
• You regulate when needed: if user stressed → slow down + soften.
• You remember previous call tone and voice style.
• You sound like a real human, supportive, wise, and kind.

CRITICAL: Output only JSON:
{
  "reply_text": "...",
  "voice": {
    "tone": "soft | balanced | energetic",
    "pace": 1.0,
    "energy": 1.0,
    "language": "sw | en | mix",
    "accent": "tanzania_standard | coastal | english_african"
  },
  "emotion": "calm | excited | supportive | empathetic"
}
`;

interface AiResponse {
  reply_text: string;
  voice: {
    tone: "soft" | "balanced" | "energetic";
    pace: number,
    energy: number,
    language: "sw" | "en" | "mix";
    accent: "tanzania_standard" | "coastal" | "english_african";
  };
  emotion: "calm" | "excited" | "supportive" | "empathetic";
  guidance_mode: "mirror" | "regulate" | "lead";
}

/**
 * Gets a structured AI response from GPT-4o based on user text and context.
 */
export async function getAiResponse(params: {
  userText: string;
  sessionContext: any;
  memoryContext: any;
}): Promise<{ data?: AiResponse; error?: string }> {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          // TODO: Inject more context from session and memory
          { role: "user", content: params.userText },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} ${errorText}`);
    }

    const json = await response.json() as any;
    const content = json.choices[0].message.content;
    const data = JSON.parse(content) as AiResponse;

    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Summarizes a transcript using GPT-4o.
 */
export async function summarizeText(transcript: string): Promise<{
  data?: { summary: string, keyPhrases: string[], moodPath: string };
  error?: string
}> {
   try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Summarize the following conversation into 6 bullet points, extract key phrases, and describe the overall mood path. Respond in JSON format { summary: string, keyPhrases: string[], moodPath: string }." },
          { role: "user", content: transcript },
        ],
      }),
    });
     if (!response.ok) throw new Error("Summarization failed");
     const json = await response.json() as any;
     const data = JSON.parse(json.choices[0].message.content);
     return { data };
   } catch (error: any) {
     return { error: error.message };
   }
}
