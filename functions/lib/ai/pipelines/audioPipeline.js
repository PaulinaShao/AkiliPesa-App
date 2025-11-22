import { openaiTTS } from "../adapters/openai";
import { whisperTranscribe } from "../adapters/whisper";
export async function runAudioPipeline(payload, vendor) {
    if (payload.type === "tts") {
        return openaiTTS(payload.text || "");
    }
    if (payload.type === "transcribe") {
        return whisperTranscribe(payload.audioUrl || "");
    }
    throw new Error(`Unsupported audio type: ${payload.type}`);
}
