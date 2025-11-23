//---------------------------------------------------------
// FIXED AI ROUTER — vendor is AiVendor, not a string
//---------------------------------------------------------

import { onCall } from "firebase-functions/v2/https";
import { db } from "../firebase.js";
import { selectVendor } from "./common/vendorSelector.js";
import {
  runTextPipeline
} from "./pipelines/textPipeline.js";
import {
  runImagePipeline
} from "./pipelines/imagePipeline.js";
import {
  runAudioPipeline
} from "./pipelines/audioPipeline.js";
import {
  runMusicPipeline
} from "./pipelines/musicPipeline.js";
import {
  runVideoPipeline
} from "./pipelines/videoPipeline.js";
import {
  runVoiceClonePipeline
} from "./pipelines/voiceClonePipeline.js";
import {
  runMultiFormatPipeline
} from "./pipelines/multiFormatPipeline.js";
import { validateAIInput } from "./common/validateInput.js";
import { OPENAI_API_KEY } from "../config/secrets.js";

export const aiRouter = onCall(
  { region: "us-central1", secrets: [OPENAI_API_KEY] },
  async (req) => {
    const { uid } = req.auth!;
    const { mode, payload, metadata } = req.data;

    validateAIInput(mode, payload);

    const vendor = selectVendor(mode); // FIX #2

    let result;

    switch (mode) {
      case "text":
        result = await runTextPipeline(payload, vendor);
        break;
      case "image":
        result = await runImagePipeline(payload, vendor);
        break;
      case "audio":
      case "tts":
        result = await runAudioPipeline(payload, vendor);
        break;
      case "music":
        result = await runMusicPipeline(payload, vendor);
        break;
      case "video":
        result = await runVideoPipeline(payload, vendor);
        break;
      case "voice_clone":
        result = await runVoiceClonePipeline(payload, vendor);
        break;
      case "multi":
        result = await runMultiFormatPipeline(payload, vendor);
        break;
      default:
        throw new Error("Invalid AI mode");
    }

    await db.collection("aiLogs").add({
      uid,
      mode,
      vendor: vendor.name,
      payload,
      metadata: metadata || {},
      resultType: result.type,
      createdAt: new Date(),
    });

    return {
      ok: true,
      result: { ...result, vendor: vendor.name },
    };
  }
);
