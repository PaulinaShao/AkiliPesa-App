// functions/src/ai/common/errorHandler.ts

export function formatAIError(e: any) {
  console.error("AI Engine error:", e);

  return {
    ok: false,
    error: e?.message || "Unknown AI error",
  };
}
