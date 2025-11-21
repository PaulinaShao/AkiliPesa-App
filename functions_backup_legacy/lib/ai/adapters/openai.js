"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oaiChat = oaiChat;
exports.oaiImage = oaiImage;
exports.oaiTTS = oaiTTS;
exports.chat = chat;
exports.run = run;
// functions/src/ai/adapters/openai.ts
const secrets_1 = require("../../config/secrets");
const node_fetch_1 = __importDefault(require("node-fetch"));
const OAI_BASE = "https://api.openai.com/v1";
function auth() {
    return {
        Authorization: `Bearer ${secrets_1.OPENAI_API_KEY.value()}`,
        "Content-Type": "application/json",
    };
}
/**
 * Original helper: simple chat with system + user prompt.
 * Returns plain string text.
 */
async function oaiChat(prompt, system = "You are AkiliPesa AI: warm, supportive, and concise.", model = "gpt-4o-mini") {
    const r = await (0, node_fetch_1.default)(`${OAI_BASE}/chat/completions`, {
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
    return j.choices?.[0]?.message?.content || "";
}
/**
 * DALL·E 3 text-to-image – unchanged
 */
async function oaiImage(prompt, size = "1024x1024") {
    const r = await (0, node_fetch_1.default)(`${OAI_BASE}/images/generations`, {
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
    return j.data?.[0]?.b64_json; // base64 PNG
}
/**
 * TTS (Voice back to user) – unchanged
 */
async function oaiTTS(text) {
    const r = await (0, node_fetch_1.default)(`${OAI_BASE}/audio/speech`, {
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
async function chat(params) {
    try {
        const text = await oaiChat(params.user, params.system, params.model ?? "gpt-4o-mini");
        return { text };
    }
    catch (e) {
        console.error("openai.chat failed:", e);
        return { text: "", error: e?.message || "openai_chat_failed" };
    }
}
/**
 * NEW: run() – what adapters/selector.ts expects
 * Very generic wrapper around oaiChat.
 */
async function run(payload) {
    const prompt = payload?.prompt ??
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
    }
    catch (e) {
        console.error("openai.run failed:", e);
        return {
            output: null,
            error: e?.message || "openai_run_failed",
            provider: "openai",
        };
    }
}
//# sourceMappingURL=openai.js.map