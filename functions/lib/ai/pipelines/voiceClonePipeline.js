export async function runVoiceClonePipeline(payload, vendor) {
    const res = await vendor.handle({
        mode: "voice_clone",
        prompt: payload?.prompt ?? "",
    });
    return {
        type: "audio",
        text: res.text,
        url: res.url,
        buffer: res.buffer,
        vendor: vendor.name,
        mode: "voice_clone",
    };
}
