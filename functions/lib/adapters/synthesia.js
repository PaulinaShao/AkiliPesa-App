// TODO: Implement Synthesia adapter
// This would interact with the Synthesia API for generating avatar videos.
export async function run(payload, options, secrets) {
    const { SYNTHESIA_API_KEY } = secrets;
    console.log("Calling Synthesia adapter with payload:", payload);
    // Placeholder
    return {
        outputUrl: "gs://your-bucket/mock-avatar-video.mp4",
        costEstimate: 0.12,
    };
}
//# sourceMappingURL=synthesia.js.map