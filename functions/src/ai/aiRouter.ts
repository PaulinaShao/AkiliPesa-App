import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebase.js";
import { selectVendor } from "./common/vendorSelector.js";
import { validateAIInput } from "./common/validateInput.js";
import { runTextPipeline } from "./pipelines/textPipeline.js";
import { runImagePipeline } from "./pipelines/imagePipeline.js";
import { runAudioPipeline } from "./pipelines/audioPipeline.js";
import { runVideoPipeline } from "./pipelines/videoPipeline.js";
import { runMusicPipeline } from "./pipelines/musicPipeline.js";
import { runVoiceClonePipeline } from "./pipelines/voiceClonePipeline.js";
import { runMultiFormatPipeline } from "./pipelines/multiFormatPipeline.js";
import { AIResult } from "./adapters/types.js";

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
