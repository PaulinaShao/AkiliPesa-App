export async function runTextPipeline(payload, vendor) {
    const res = await vendor.handle({
        mode: "text",
        prompt: payload.prompt,
    });
    return {
        type: "text",
        text: res.text,
    };
}
