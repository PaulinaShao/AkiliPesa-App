import { openaiText } from "../adapters/openai.js";
export async function runTextPipeline(payload, vendor) {
    switch (vendor) {
        case "openai":
        default:
            return openaiText(payload.prompt);
    }
}
