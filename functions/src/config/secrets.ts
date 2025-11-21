// functions/src/config/secrets.ts
import { defineSecret } from "firebase-functions/params";

export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// Agora
export const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
export const AGORA_APP_CERT = defineSecret("AGORA_APP_CERT");

// Later you add:
// export const RUNPOD_API_KEY = defineSecret("RUNPOD_API_KEY");
// export const UDIO_API_KEY = defineSecret("UDIO_API_KEY");
// export const RUNWAY_API_KEY = defineSecret("RUNWAY_API_KEY");
// etc.
