export async function sunoMusic(prompt) {
    // TODO: replace with real Suno API when integrated
    const json = { message: "Suno placeholder" };
    return {
        vendor: "suno",
        mode: "music",
        type: "audio",
        url: "https://example.com/suno-placeholder.mp3",
        meta: json,
    };
}
