import { openaiTTS } from "../adapters/openai.js";
import { whisperTranscribe } from "../adapters/whisper.js";
export async function runAudioPipeline(payload, vendor) {
    if (payload.type === "tts") {
        return openaiTTS(payload.text || "");
    }
    if (payload.type === "transcribe") {
        return whisperTranscribe(payload.audioUrl || "");
    }
    throw new Error(`Unsupported audio type: ${payload.type}`);
}
