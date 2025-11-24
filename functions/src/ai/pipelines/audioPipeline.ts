// functions/src/ai/pipelines/audioPipeline.ts
import type { AIResult, AiVendor } from "../adapters/types.js";

interface AudioPayload {
  type: "tts" | "transcribe";
  text?: string;
  audioUrl?: string;
}

export async function runAudioPipeline(
  payload: AudioPayload,
  vendor: AiVendor,
  userId: string,
  extra: Record<string, any> = {}
): Promise<AIResult> {
  if (payload.type === "tts") {
    const res = await vendor.handle({
      mode: "tts",
      prompt: payload.text || "",
      userId,
      extra,
      text: payload.text || "",
    });

    return {
      type: "audio",
      buffer: res.buffer,
      vendor: vendor.name,
      mode: "tts",
      meta: res.meta,
    };
  }

  if (payload.type === "transcribe") {
    const res = await vendor.handle({
      mode: "audio", // will be implemented by an audio/STT vendor later
      prompt: "",
      userId,
      extra,
      audioUrl: payload.audioUrl || "",
    });

    return {
      type: "text",
      text: res.text,
      vendor: vendor.name,
      mode: "audio",
      meta: res.meta,
    };
  }

  throw new Error(`Unsupported audio type: ${payload.type}`);
}
