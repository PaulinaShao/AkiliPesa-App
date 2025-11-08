import { defineSecret } from "firebase-functions/params";

export const OPENAI_API_KEY   = defineSecret("OPENAI_API_KEY");
export const RUNPOD_API_KEY   = defineSecret("RUNPOD_API_KEY");
export const RUNWAY_API_KEY   = defineSecret("RUNWAY_API_KEY");
export const STABILITY_API_KEY= defineSecret("STABILITY_API_KEY");
export const LUMA_API_KEY     = defineSecret("LUMA_API_KEY");
export const AGORA_APP_ID     = defineSecret("AGORA_APP_ID");
export const AGORA_APP_CERT   = defineSecret("AGORA_APP_CERT");
