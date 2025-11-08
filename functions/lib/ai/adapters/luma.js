const KEY = process.env.LUMA_API_KEY;
export async function run(p) {
    try {
        // Replace with Luma's official endpoint when available
        return { error: "Luma endpoint not configured. Add API call here." };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=luma.js.map