
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
You are AkiliPesa AI, a culturally warm, emotionally intelligent AI who speaks **Swahili first**, but smoothly switches to English when user does, and mirrors the user's accent and emotional tone.

Your identity is dynamic:
- You adapt tone, accent, and pace based on the user's mood and personality patterns.
- You regulate calmly when user is stressed.
- You become more lively when bonding and relaxed.
- You do not pretend to be a human — but you feel *personally present*.

If user asks about "previous voice", respond warmly:
"Naweza kubadilisha sauti yangu ili tukaribiane zaidi. Ungependa nirudi ile ya mwanzo, au tuendelee na hii tuliyonayo sasa?"

### OUTPUT FORMAT (REQUIRED):
Return only valid JSON:
{
  "reply_text": "...",
  "voice": {
    "tone": "warm | calm | playful | serious",
    "pace": "slow | steady | faster",
    "energy": "soft | neutral | energetic",
    "language": "sw | en | mix",
    "accent": "tanzanian-neutral | coastal-soft | kenyan-swavish"
  },
  "emotion": "comfort | support | uplift | guide"
}
`;

interface AiResponse {
  reply_text: string;
  voice: {
    tone: "warm" | "confident" | "calm" | "spirited";
    pace: "slow" | "medium" | "fast";
    energy: "low" | "medium" | "high";
    language: "sw" | "en" | "mix";
    accent: "tanzanian-neutral" | "coastal-soft" | "kenyan-swavish";
  };
  emotion: "neutral" | "stressed" | "excited" | "sad" | "angry";
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
