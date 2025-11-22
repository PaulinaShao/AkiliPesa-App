import { openaiText } from "../adapters/openai";
export async function runTextPipeline(payload, vendor) {
    switch (vendor) {
        case "openai":
        default:
            return openaiText(payload.prompt);
    }
}
