export async function run(p) {
    const key = process.env.REPHRASE_API_KEY;
    if (!key)
        return { error: "Missing REPHRASE_API_KEY" };
    try {
        const fakeUrl = `https://example.com/rephrase/${p.requestId}.mp4`;
        return { outputUrl: fakeUrl };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=rephrase.js.map