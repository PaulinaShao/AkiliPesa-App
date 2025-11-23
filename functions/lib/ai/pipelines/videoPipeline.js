export async function runVideoPipeline(payload, vendor) {
    const res = await vendor.handle({
        mode: "video",
        prompt: payload?.prompt ?? "",
    });
    return {
        type: "video",
        text: res.text,
        url: res.url,
        buffer: res.buffer,
        vendor: vendor.name,
        mode: "video",
    };
}
