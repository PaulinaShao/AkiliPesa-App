export async function kaiberVideo(payload) {
    // TODO: real Kaiber API
    return {
        vendor: "kaiber",
        mode: "video",
        type: "video",
        url: "https://example.com/kaiber-video.mp4",
        meta: { payload },
    };
}
