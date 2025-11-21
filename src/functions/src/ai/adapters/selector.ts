
// functions/src/ai/adapters/selector.ts
import { AiRequest, AiVendor } from "./types";
import { openAiVendor } from "./openai";

// Later: import { runpodVendor } from "./runpod"; etc.

const vendors: AiVendor[] = [
  openAiVendor,
  // runpodVendor,
  // udioVendor,
  // runwayVendor,
  // pikaVendor,
  // lumaVendor,
  // synthesiaVendor,
  // deepMotionVendor,
];

export function selectVendor(
  mode: AiRequest["mode"],
  preferred?: string
): AiVendor {
  if (preferred) {
    const found = vendors.find((v) => v.name === preferred);
    if (found && found.supports.includes(mode)) return found;
  }

  // For now: OpenAI default; later we will use vendorOptimizer config.
  const fallback = vendors.find((v) => v.supports.includes(mode));
  if (!fallback) {
    throw new Error(`No vendor supports mode: ${mode}`);
  }
  return fallback;
}
