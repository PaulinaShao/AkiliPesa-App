"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const KEY = process.env.DEEPMOTION_API_KEY;
async function run(p) {
    try {
        // Replace with DeepMotion's official endpoint when available
        return { error: "DeepMotion endpoint not configured. Add API call here." };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=deepmotion.js.map