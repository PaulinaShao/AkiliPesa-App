"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdxlImage = sdxlImage;
const secrets_1 = require("../../config/secrets");
const node_fetch_1 = __importDefault(require("node-fetch"));
// SDXL text-to-image
async function sdxlImage(prompt) {
    const r = await (0, node_fetch_1.default)("https://api.stability.ai/v2beta/stable-image/generate/core", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secrets_1.STABILITY_API_KEY.value()}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, output_format: "png", aspect_ratio: "1:1" })
    });
    if (!r.ok)
        throw new Error(await r.text());
    const j = await r.json();
    return j.image; // base64
}
//# sourceMappingURL=stability.js.map