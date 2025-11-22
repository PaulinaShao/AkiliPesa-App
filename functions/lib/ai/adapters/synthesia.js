export async function synthesiaAvatarVideo(payload) {
    // TODO: real Synthesia API
    return {
        vendor: "synthesia",
        mode: "video",
        type: "video",
        url: "https://example.com/synthesia-avatar.mp4",
        meta: { payload },
    };
}
