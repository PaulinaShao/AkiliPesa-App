"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const KEY = process.env.KAIBER_API_KEY;
async function run(p) {
    try {
        // Replace with Kaiber's official endpoint when available
        return { error: "Kaiber endpoint not configured. Add API call here." };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=kaiber.js.map