export async function runAudioPipeline(payload, vendor) {
    if (payload.type === "tts") {
        const res = await vendor.handle({
            mode: "tts",
            text: payload.text || "",
        });
        return {
            type: "audio",
            buffer: res.buffer,
        };
    }
    if (payload.type === "transcribe") {
        const res = await vendor.handle({
            mode: "audio", // Assuming vendor has an 'audio' mode for transcription
            audioUrl: payload.audioUrl || "",
        });
        return {
            type: "text",
            text: res.text,
        };
    }
    throw new Error(`Unsupported audio type: ${payload.type}`);
}
