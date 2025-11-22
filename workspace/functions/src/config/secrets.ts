// functions/src/config/secrets.ts
import { defineSecret } from "firebase-functions/params";

export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
export const RUNPOD_API_KEY = defineSecret("RUNPOD_API_KEY");
export const WHISPER_API_KEY = defineSecret("WHISPER_API_KEY");
export const UDIO_API_KEY = defineSecret("UDIO_API_KEY");
export const SUNO_API_KEY = defineSecret("SUNO_API_KEY");
export const KAIBER_API_KEY = defineSecret("KAIBER_API_KEY");
export const PIKA_API_KEY = defineSecret("PIKA_API_KEY");
export const LUMA_API_KEY = defineSecret("LUMA_API_KEY");
export const DEEPMOTION_API_KEY = defineSecret("DEEPMOTION_API_KEY");
export const SYNTHESIA_API_KEY = defineSecret("SYNTHESIA_API_KEY");


// Agora
export const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
export const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");

// Later you add:
// export const RUNWAY_API_KEY = defineSecret("RUNWAY_API_KEY");
// etc.
