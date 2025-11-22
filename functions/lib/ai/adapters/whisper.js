/**
 * This is a placeholder – in many setups Whisper is accessed via OpenAI or your own server.
 */
export async function whisperTranscribe(audioUrl) {
    // TODO: implement real Whisper / RunPod / custom endpoint call
    return {
        mode: "audio",
        type: "text",
        text: "[transcript placeholder]",
        meta: { audioUrl },
    };
}
