import { kaiberVideo } from "../adapters/kaiber.js";
import { pikaVideo } from "../adapters/pika.js";
import { lumaVideo } from "../adapters/luma.js";
export async function runVideoPipeline(payload, vendor) {
    if (vendor === "kaiber")
        return kaiberVideo(payload);
    if (vendor === "pika")
        return pikaVideo(payload);
    if (vendor === "luma")
        return lumaVideo(payload);
    return kaiberVideo(payload);
}
