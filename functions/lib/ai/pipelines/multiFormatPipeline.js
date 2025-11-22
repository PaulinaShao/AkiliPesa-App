/**
 * High-level “any format → any format” pipeline.
 * For now this is a placeholder that echoes payload; later we chain multiple adapters.
 */
export async function runMultiFormatPipeline(payload, vendor) {
    return {
        type: "multi",
        text: "Multi-format pipeline placeholder",
        vendor,
        meta: { payload },
    };
}
