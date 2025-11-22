export async function runMusicPipeline(payload, vendor) {
    const res = await vendor.handle({
        mode: "music",
        prompt: payload?.prompt ?? payload?.text ?? "",
    });
    return {
        type: "audio",
        text: res.text,
        url: res.url,
        buffer: res.buffer,
        vendor: vendor.name,
        mode: "music",
    };
}
