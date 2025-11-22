import { openaiImage } from "../adapters/openai.js";
import { runpodImage } from "../adapters/runpod.js";
export async function runImagePipeline(payload, vendor) {
    if (vendor === "runpod")
        return runpodImage(payload.prompt);
    return openaiImage(payload.prompt);
}
