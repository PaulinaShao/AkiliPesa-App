const KEY = process.env.SYNTHESIA_API_KEY;
export async function run(p) {
    try {
        // Replace with Synthesia's official endpoint when available
        return { error: "Synthesia endpoint not configured. Add API call here." };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=synthesia.js.map