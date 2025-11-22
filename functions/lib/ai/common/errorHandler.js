export function formatAIError(e) {
    console.error("AI Engine error:", e);
    return {
        ok: false,
        error: e?.message || "Unknown AI error",
    };
}
