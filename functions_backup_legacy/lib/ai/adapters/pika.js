"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const KEY = process.env.PIKA_API_KEY;
async function run(p) {
    try {
        // Replace with Pika's official endpoint when available
        return { error: "Pika endpoint not configured. Add API call here." };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=pika.js.map