
import fetch from "node-fetch";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function generateAIResponse(userText: string, sessionState: any) {
  const systemPrompt = `
You are AkiliPesa AI.
Speak Swahili first.
Adapt accent based on user speech.
If user uses English, switch softly and naturally.
Output ONLY valid JSON:
{
  "reply_text": "...",
  "voice": {
    "tone": "soft|balanced|energetic",
    "pace": 0.7-1.3,
    "energy": 0.6-1.4,
    "language": "sw|en",
    "accent": "tanzania_standard|coastal|english_african"
  },
  "emotion": "calm|supportive|excited|empathetic"
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
    }),
  });

  const json = await res.json() as any;
  if (!json.choices?.[0]?.message?.content) {
    throw new Error('OpenAI failed to generate a response.');
  }
  return JSON.parse(json.choices[0].message.content);
}
