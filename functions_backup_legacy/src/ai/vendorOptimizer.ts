type Plan = "free" | "pro" | "vip";

export function pickImageVendor(plan: Plan, wallet: number) {
  // Cheap fallback if low balance
  if (wallet < 0.1) return { vendor: "stability", size: "512x512" as const };
  // VIP → OpenAI 1024
  if (plan === "vip") return { vendor: "openai", size: "1024x1024" as const };
  // Pro default → OpenAI 512
  if (plan === "pro") return { vendor: "openai", size: "512x512" as const };
  // Free → Stability
  return { vendor: "stability", size: "512x512" as const };
}

export function pickVideoVendor(plan: Plan, wallet: number) {
  if (plan === "vip" && wallet >= 1) return { vendor: "luma" as const };
  return { vendor: "runway" as const }; // default
}
