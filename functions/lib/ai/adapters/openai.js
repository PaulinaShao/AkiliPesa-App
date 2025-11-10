"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
exports.chat = chat;
exports.tts = tts;
const KEY = process.env.OPENAI_API_KEY;
async function run(p) {
    // default route: chat → return data:url of text
    const r = await chat({ system: "You are AkiliPesa AI.", user: p.input });
    if (r.error)
        return r;
    const text = r.text;
    return { outputUrl: `data:text/plain;base64,${Buffer.from(text).toString("base64")}`, meta: { text } };
}
async function chat({ system, user }) {
    if (!KEY)
        return { error: "Missing OPENAI_API_KEY" };
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-4o", // change per plan
                messages: [
                    ...(system ? [{ role: "system", content: system }] : []),
                    { role: "user", content: user }
                ]
            })
        });
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || null;
        return text ? { text } : { error: "No content returned from OpenAI" };
    }
    catch (e) {
        return { error: e.message };
    }
}
async function tts({ text, voice = "alloy", format = "mp3" }) {
    if (!KEY)
        return { error: "Missing OPENAI_API_KEY" };
    try {
        const res = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "tts-1", input: text, voice, response_format: format })
        });
        if (!res.ok) {
            const errorText = await res.text();
            return { error: `OpenAI TTS Error: ${errorText}` };
        }
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = format === "wav" ? "audio/wav" : "audio/mpeg";
        return { outputUrl: `data:${mime};base64,${buf.toString("base64")}` };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=openai.js.map