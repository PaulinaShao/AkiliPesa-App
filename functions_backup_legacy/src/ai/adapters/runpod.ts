// functions/src/ai/adapters/runpod.ts
import { RUNPOD_API_KEY } from "../../config/secrets";
import fetch from "node-fetch";

/**
 * Existing helper: Whisper transcription via RunPod
 * (kept as-is for backwards compatibility)
 */
export async function runpodWhisperTranscribe(
  fileUrl: string,
  endpointId: string
): Promise<string> {
  const r = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RUNPOD_API_KEY.value()}`,
    },
    body: JSON.stringify({ input: { audio_url: fileUrl } }),
  });
  const j = await r.json();
  return (j as any).output?.text as string;
}

// Generic endpoints (configure in env)
const RUNPOD_GENERIC_ENDPOINT_ID =
  process.env.RUNPOD_GENERIC_ENDPOINT_ID || "";
const RUNPOD_CLONE_VOICE_ENDPOINT_ID =
  process.env.RUNPOD_CLONE_VOICE_ENDPOINT_ID || "";

/**
 * NEW: run() – what adapters/selector.ts expects
 * Generic text-style task on RunPod.
 */
export async function run(payload: any): Promise<any> {
  if (!RUNPOD_GENERIC_ENDPOINT_ID || !RUNPOD_API_KEY.value()) {
    console.warn("RunPod generic endpoint not configured.");
    return {
      output: null,
      error: "runpod_not_configured",
      provider: "runpod",
    };
  }

  const prompt =
    payload?.prompt ??
    payload?.text ??
    (typeof payload === "string"
      ? payload
      : JSON.stringify(payload || {}));

  const r = await fetch(
    `https://api.runpod.ai/v2/${RUNPOD_GENERIC_ENDPOINT_ID}/run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUNPOD_API_KEY.value()}`,
      },
      body: JSON.stringify({ input: { prompt } }),
    }
  );

  const j = await r.json();

  return {
    output: (j as any).output ?? null,
    provider: "runpod",
  };
}

/**
 * NEW: cloneVoice() – what createVoiceClone.ts expects
 * The exact schema depends on your RunPod model; this is a
 * generic pattern that you can adapt once you know the fields.
 */
export async function cloneVoice(params: {
  audioBase64: string;
  voiceName: string;
}): Promise<{ voiceId?: string; error?: string }> {
  if (!RUNPOD_CLONE_VOICE_ENDPOINT_ID || !RUNPOD_API_KEY.value()) {
    const error = "runpod_voice_clone_not_configured";
    console.warn(error);
    return { error };
  }

  try {
    const r = await fetch(
      `https://api.runpod.ai/v2/${RUNPOD_CLONE_VOICE_ENDPOINT_ID}/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RUNPOD_API_KEY.value()}`,
        },
        body: JSON.stringify({
          input: {
            audio_base64: params.audioBase64,
            name: params.voiceName,
          },
        }),
      }
    );

    const j = await r.json();
    // Adjust these fields once you know your model's response
    const voiceId =
      (j as any).output?.voiceId ||
      (j as any).output?.id ||
      (j as any).id;

    if (!voiceId) {
      return { error: "runpod_voice_id_missing" };
    }

    return { voiceId };
  } catch (e: any) {
    console.error("RunPod cloneVoice error:", e);
    return { error: e?.message || "runpod_clone_voice_failed" };
  }
}
