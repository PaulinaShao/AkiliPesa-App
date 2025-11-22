import { openaiImage } from "../adapters/openai";
import { runpodImage } from "../adapters/runpod";
export async function runImagePipeline(payload, vendor) {
    if (vendor === "runpod")
        return runpodImage(payload.prompt);
    return openaiImage(payload.prompt);
}
