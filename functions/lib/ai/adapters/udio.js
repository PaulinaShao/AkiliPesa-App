export async function udioMusic(prompt) {
    // TODO: replace with real Udio API call when available
    const json = { message: "Udio placeholder" };
    return {
        vendor: "udio",
        mode: "music",
        type: "audio",
        url: "https://example.com/udio-placeholder.mp3",
        meta: json,
    };
}
