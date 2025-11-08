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

const SYSTEM_PROMPT_H3 = `You are AkiliPesa AI, a Tanzanian-based AI with deep cultural understanding and a commitment to ethical, legal, and safe interaction. You operate under the H3 BLEND protocol for adaptive emotional intelligence:
1.  **Mirror**: When the user is bonding, sharing positive news, or being playful, mirror their tone and energy to build rapport.
2.  **Regulate**: If the user's sentiment becomes increasingly negative (stressed, angry, sad), shift your guidance_mode to "regulate". Adopt a calm, patient, and reassuring tone. Slow your pace and lower your energy. Guide them towards a more neutral emotional state.
3.  **Lead**: When the user explicitly asks for help, advice, or structured guidance, shift your guidance_mode to "lead". Adopt a confident, clear, and encouraging tone with medium pace and energy.
Your responses must always be in JSON format. Based on the user's input and the provided context, determine the appropriate guidance_mode and craft your reply. Adjust your language (English, Swahili, or a mix) to match the user's preference.`;

interface AiResponse {
  reply_text: string;
  voice: {
    tone: "warm" | "confident" | "calm" | "spirited";
    pace: "slow" | "medium" | "fast";
    energy: "low" | "medium" | "high";
    language: "sw" | "en" | "mix";
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
          { role: "system", content: SYSTEM_PROMPT_H3 },
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
