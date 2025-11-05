
import { VendorPayload, VendorResult } from "./types";

export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { error: "Missing OPENAI_API_KEY" };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5", // or gpt-4.1 / gpt-o-mini based on cost
        messages: [
          { role: "system", content: "You are AkiliPesa AI with emotional intelligence." },
          { role: "user", content: p.input }
        ]
      })
    });

    const data = await res.json();
    if (!data?.choices?.[0]?.message?.content)
      return { error: "No response returned" };

    // Store text output in Firestore as an accessible text URL:
    const outputText = data.choices[0].message.content;

    return {
      outputUrl: `data:text/plain;base64,${Buffer.from(outputText).toString("base64")}`
    };
  } catch (e: any) {
    return { error: e.message };
  }
}
