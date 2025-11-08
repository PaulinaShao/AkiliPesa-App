const KEY = process.env.HEYGEN_API_KEY;
export async function run(p) {
    try {
        // Replace with HeyGen's official endpoint when available
        return { error: "HeyGen endpoint not configured. Add API call here." };
    }
    catch (e) {
        return { error: e.message };
    }
}
//# sourceMappingURL=heygen.js.map