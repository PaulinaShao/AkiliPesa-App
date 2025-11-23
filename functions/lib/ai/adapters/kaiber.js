export async function kaiberVideo(payload) {
    // TODO: real Kaiber API
    return {
        mode: "video",
        type: "video",
        url: "https://example.com/kaiber-video.mp4",
        meta: { payload },
    };
}
