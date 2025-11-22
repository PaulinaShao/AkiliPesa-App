export async function pikaVideo(payload) {
    // TODO: real Pika API
    return {
        mode: "video",
        type: "video",
        url: "https://example.com/pika-video.mp4",
        meta: { payload },
    };
}
