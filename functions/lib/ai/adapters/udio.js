"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const KEY = process.env.UDIO_API_KEY;
const BASE = "https://api.udio.com/v1";
async function run(p) {
    try {
        // 1) Create job
        const create = await fetch(`${BASE}/tracks`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: p.input,
                // User may specify:
                duration: p.options?.duration ?? 20,
                genre: p.options?.genre ?? undefined,
                mood: p.options?.mood ?? undefined,
                // No vocals by default; to enable:
                vocal_style: p.options?.vocalStyle ?? undefined
            })
        }).then(r => r.json());
        if (!create?.id)
            return { error: `UDIO: create failed: ${JSON.stringify(create)}` };
        const id = create.id;
        // 2) Poll job until complete
        let status = create.status;
        let outputUrl = null;
        let tries = 0;
        while (status === "queued" || status === "processing") {
            await new Promise(r => setTimeout(r, 4500));
            const poll = await fetch(`${BASE}/tracks/${id}`, {
                headers: { Authorization: `Bearer ${KEY}` }
            }).then(r => r.json());
            status = poll.status;
            outputUrl = poll.audio_url || null;
            // Stop if too many polls
            if (++tries > 50)
                break;
        }
        if (status !== "completed" || !outputUrl) {
            return { error: "UDIO job failed or no output URL" };
        }
        return { outputUrl };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=udio.js.map