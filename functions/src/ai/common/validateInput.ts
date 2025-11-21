import { HttpsError } from "firebase-functions/v2/https";

export function validateAIInput(mode: string, payload: any) {
  if (!mode) {
    throw new HttpsError("invalid-argument", "'mode' is required.");
  }

  if (!payload) {
    throw new HttpsError("invalid-argument", "'payload' is required.");
  }

  if (["text", "image", "music", "video"].includes(mode) && !payload.prompt) {
    throw new HttpsError(
      "invalid-argument",
      "'payload.prompt' is required for this mode."
    );
  }

  if (mode === "audio" && !payload.audioUrl && !payload.text) {
    throw new HttpsError(
      "invalid-argument",
      "audio mode requires 'audioUrl' or 'text'."
    );
  }
}
