import { AIResult } from "../adapters/types";
import { udioMusic } from "../adapters/udio";
import { sunoMusic } from "../adapters/suno";

export async function runMusicPipeline(
  payload: { prompt: string },
  vendor: string
): Promise<AIResult> {
  if (vendor === "udio") return udioMusic(payload.prompt);
  if (vendor === "suno") return sunoMusic(payload.prompt);

  // fallback:
  return udioMusic(payload.prompt);
}
