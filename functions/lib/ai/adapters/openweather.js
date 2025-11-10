"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const KEY = process.env.OPENWEATHER_API_KEY;
async function run(p) {
    try {
        if (!KEY)
            return { error: "Missing OPENWEATHER_API_KEY" };
        const q = encodeURIComponent(p.input);
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${KEY}&units=metric`);
        const data = await res.json();
        if (res.status !== 200)
            return { error: data.message || "Failed to fetch weather data" };
        return { outputUrl: `data:application/json;base64,${Buffer.from(JSON.stringify(data)).toString("base64")}`, meta: data };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=openweather.js.map