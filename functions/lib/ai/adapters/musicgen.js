const URL = process.env.MUSICGEN_API_URL;
export async function run(p) {
    try {
        if (!URL)
            return { error: "MusicGen self-hosted URL not configured." };
        const res = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: p.input, duration: p.options?.duration ?? 8 })
        });
        const data = await res.json();
        if (data?.audio_base64)
            return { outputUrl: `data:audio/wav;base64,${data.audio_base64}` };
        if (data?.url)
            return { outputUrl: data.url };
        return { error: "No audio returned from MusicGen endpoint" };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=musicgen.js.map