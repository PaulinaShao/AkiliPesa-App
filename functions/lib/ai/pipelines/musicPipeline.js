import { udioMusic } from "../adapters/udio";
import { sunoMusic } from "../adapters/suno";
export async function runMusicPipeline(payload, vendor) {
    if (vendor === "udio")
        return udioMusic(payload.prompt);
    if (vendor === "suno")
        return sunoMusic(payload.prompt);
    // fallback:
    return udioMusic(payload.prompt);
}
