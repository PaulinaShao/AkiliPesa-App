
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

// --- Core AI & Call Flows ---
export { createAiCallSession } from "./ai/createAiCallSession";
export { callSessionHandler, enqueueTTS } from "./ai/callSessionHandler";
export { callLiveLoop } from "./ai/callLiveLoop";
export { endAiCall } from "./ai/endAiCall";
export { summarizeAiSession } from "./ai/summarizeSession";
export { createVoiceClone } from "./ai/createVoiceClone";

// --- Original AI Router & Adapters ---
export { aiRouter, pollVideoJob, createRtcToken } from "./ai/aiRouter";
export { getAgoraToken } from "./adapters/agora";
