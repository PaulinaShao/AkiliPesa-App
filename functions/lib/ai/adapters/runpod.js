"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
exports.cloneVoice = cloneVoice;
const KEY = process.env.RUNPOD_API_KEY;
const ENDPOINT = process.env.RUNPOD_OPENVOICE_ENDPOINT_ID;
async function run(p) {
    if (!KEY)
        return { error: "Missing RUNPOD_API_KEY" };
    if (!ENDPOINT)
        return { error: "Missing RUNPOD_OPENVOICE_ENDPOINT_ID" };
    try {
        const job = await fetch(`https://api.runpod.ai/v2/${ENDPOINT}/run`, {
            method: "POST",
            headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ input: { text: p.input, voice_id: p.options?.voiceId || "default" } })
        }).then(r => r.json());
        if (!job?.id)
            return { error: "RunPod job create failed" };
        let status = "IN_PROGRESS", output = null;
        while (status === "IN_PROGRESS" || status === "IN_QUEUE") {
            await new Promise(r => setTimeout(r, 4000));
            const poll = await fetch(`https://api.runpod.ai/v2/${ENDPOINT}/status/${job.id}`, {
                headers: { Authorization: `Bearer ${KEY}` }
            }).then(r => r.json());
            status = poll.status;
            output = poll.output || null;
            if (poll.status === 'FAILED')
                return { error: poll.error || "RunPod job failed" };
        }
        if (!output?.audio_base64)
            return { error: "No audio in output from RunPod" };
        return { outputUrl: `data:audio/wav;base64,${output.audio_base64}` };
    }
    catch (e) {
        return { error: e.message };
    }
}
async function cloneVoice({ audioBase64, voiceName }) {
    // Implement your endpoint’s clone route if provided; placeholder:
    // This would typically be another RunPod job submission to a different input schema.
    console.log(`Cloning voice ${voiceName} via RunPod (placeholder)`);
    return { voiceId: `runpod_clone_${Date.now()}` };
}
//# sourceMappingURL=runpod.js.map