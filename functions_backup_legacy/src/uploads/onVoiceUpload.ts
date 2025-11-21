import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

export const onVoiceUpload = onObjectFinalized(async (event) => {
  const bucket = event.data.bucket; // dynamic bucket!
  logger.info("Voice uploaded:", event.data.name, "bucket:", bucket);
});
