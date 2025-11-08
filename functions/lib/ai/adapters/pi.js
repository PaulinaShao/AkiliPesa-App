const KEY = process.env.PI_API_KEY;
export async function run(p) {
    if (!KEY)
        return { error: "Missing PI_API_KEY" };
    try {
        const res = await fetch("https://api.inflection.ai/v1/chat", {
            method: "POST",
            headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: { role: "user", content: p.input },
                model: "inflection-2.5",
                stream: false
            })
        });
        const data = await res.json();
        const text = data?.message?.content;
        if (!text)
            return { error: "No PI content returned" };
        return { outputUrl: `data:text/plain;base64,${Buffer.from(text).toString("base64")}`, meta: { text } };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=pi.js.map