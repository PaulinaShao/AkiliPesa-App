export async function runImagePipeline(payload, vendor) {
    const res = await vendor.handle({
        mode: "image",
        prompt: payload.prompt,
    });
    return {
        type: "image",
        url: res.url,
    };
}
