import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebase";
import { selectVendor } from "./common/vendorSelector";
import { validateAIInput } from "./common/validateInput";
import { runTextPipeline } from "./pipelines/textPipeline";
import { runImagePipeline } from "./pipelines/imagePipeline";
import { runAudioPipeline } from "./pipelines/audioPipeline";
import { runVideoPipeline } from "./pipelines/videoPipeline";
import { runMusicPipeline } from "./pipelines/musicPipeline";
import { runVoiceClonePipeline } from "./pipelines/voiceClonePipeline";
import { runMultiFormatPipeline } from "./pipelines/multiFormatPipeline";
import { AIResult } from "./adapters/types";

export const aiRouter = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");

    const uid = request.auth.uid;
    const { mode, payload, metadata } = request.data || {};

    validateAIInput(mode, payload);

    const vendor = await selectVendor(mode);
    let result: AIResult;

    switch (mode) {
      case "text":
        result = await runTextPipeline(payload, vendor);
        break;
      case "image":
        result = await runImagePipeline(payload, vendor);
        break;
      case "audio":
        result = await runAudioPipeline(payload, vendor);
        break;
      case "tts":
        result = await runAudioPipeline(
          { ...payload, type: "tts" },
          vendor
        );
        break;
      case "voice_clone":
        result = await runVoiceClonePipeline(payload, vendor);
        break;
      case "music":
        result = await runMusicPipeline(payload, vendor);
        break;
      case "video":
        result = await runVideoPipeline(payload, vendor);
        break;
      case "multi":
        result = await runMultiFormatPipeline(payload, vendor);
        break;
      default:
        throw new HttpsError("invalid-argument", `Unknown mode ${mode}`);
    }

    await db.collection("aiLogs").add({
      uid,
      mode,
      vendor,
      payload,
      metadata: metadata || {},
      resultType: result.type,
      createdAt: new Date(),
    });

    return { ok: true, result };
  }
);
