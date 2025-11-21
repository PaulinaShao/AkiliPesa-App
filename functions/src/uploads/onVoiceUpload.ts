
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";

export const onVoiceUpload = onObjectFinalized(
  { region: "us-central1" },
  async (event) => {
    logger.info("Voice uploaded:", event.data.name, "bucket:", event.data.bucket);
    // Later: trigger RunPod/OpenVoice pipeline from here.
  }
);
