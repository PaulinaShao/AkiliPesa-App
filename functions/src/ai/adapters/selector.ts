// functions/src/ai/adapters/selector.ts

import { AiRequest, AiVendor } from "./types.js";
import { openAiVendor } from "./openai.js";

// Later additional vendors will be added here:
// import { runpodVendor } from "./runpod.js";
// import { udioVendor } from "./udio.js";
// import { pikaVendor } from "./pika.js";
// import { lumaVendor } from "./luma.js";
// import { synthesiaVendor } from "./synthesia.js";
// import { deepMotionVendor } from "./deepMotion.js";

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

/**
 * Selects which AI vendor to use based on:
 *  - preferred choice
 *  - mode support
 */
export function selectVendor(
  mode: AiRequest["mode"],
  preferred?: string
): AiVendor {
  if (preferred) {
    const found = vendors.find((v) => v.name === preferred);
    if (found && found.supports.includes(mode)) {
      return found;
    }
  }

  const fallback = vendors.find((v) => v.supports.includes(mode));
  if (!fallback) {
    throw new Error(`No AI vendor available supports mode: ${mode}`);
  }

  return fallback;
}
