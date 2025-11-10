"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
exports.speak = speak;
exports.clone = clone;
const KEY = process.env.ELEVENLABS_API_KEY;
async function run(p) {
    return speak({ text: p.input, voiceId: p.options?.voiceId });
}
async function speak({ text, voiceId }) {
    try {
        const url = voiceId
            ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
            : "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"; // Fallback to a default voice
        const res = await fetch(url, {
            method: "POST",
            headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
        });
        if (!res.ok) {
            const errorText = await res.text();
            return { error: `ElevenLabs API Error: ${errorText}` };
        }
        const buf = Buffer.from(await res.arrayBuffer());
        return { outputUrl: `data:audio/mpeg;base64,${buf.toString("base64")}` };
    }
    catch (e) {
        return { error: e.message };
    }
}
// Voice cloning (multipart/form-data using global FormData in Node 20)
async function clone({ audioBase64, voiceName }) {
    try {
        const form = new FormData();
        const bytes = Buffer.from(audioBase64, "base64");
        form.append("name", voiceName);
        form.append("files", new Blob([bytes], { type: "audio/wav" }), `${voiceName}.wav`);
        const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
            method: "POST",
            headers: { "xi-api-key": KEY },
            body: form
        });
        const data = await res.json();
        if (!data?.voice_id)
            return { error: JSON.stringify(data) };
        return { voiceId: data.voice_id };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=elevenlabs.js.map