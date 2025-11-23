export async function runMultiFormatPipeline(payload, vendor) {
    // For now this is a placeholder that just tags the request.
    // Later we can chain text → image → video, etc.
    return {
        type: "multi",
        text: "Multi-format pipeline placeholder",
        vendor: vendor.name,
        mode: "multi",
        meta: { payload },
    };
}
