export async function deepmotionAnimate(payload) {
    // TODO: plug into DeepMotion animation API
    return {
        mode: "multi",
        type: "video",
        url: "https://example.com/deepmotion-animation.mp4",
        meta: { payload },
    };
}
