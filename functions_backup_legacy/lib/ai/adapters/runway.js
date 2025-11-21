"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runwayCreateVideo = runwayCreateVideo;
exports.runwayGetTask = runwayGetTask;
const secrets_1 = require("../../config/secrets");
const node_fetch_1 = __importDefault(require("node-fetch"));
// Runway Gen-2 text-to-video job create
async function runwayCreateVideo(prompt) {
    const r = await (0, node_fetch_1.default)("https://api.runwayml.com/v1/tasks", {
        method: "POST",
        headers: { Authorization: `Bearer ${secrets_1.RUNWAY_API_KEY.value()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            task: "text-to-video",
            params: { prompt, duration: 5 } // seconds
        })
    });
    return await r.json(); // { id, status, ... }
}
// Poll job
async function runwayGetTask(id) {
    const r = await (0, node_fetch_1.default)(`https://api.runwayml.com/v1/tasks/${id}`, {
        headers: { Authorization: `Bearer ${secrets_1.RUNWAY_API_KEY.value()}` }
    });
    return await r.json(); // includes asset urls when complete
}
//# sourceMappingURL=runway.js.map