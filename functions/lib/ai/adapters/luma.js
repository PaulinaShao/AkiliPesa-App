export async function lumaVideo(payload) {
    // TODO: real Luma API
    return {
        mode: "video",
        type: "video",
        url: "https://example.com/luma-video.mp4",
        meta: { payload },
    };
}
