// functions/src/index.ts
import { setGlobalOptions } from "firebase-functions/v2/options";
// Global options for all Gen 2 functions
setGlobalOptions({
    region: "us-central1",
    maxInstances: 2,
});
// ---------- AI ENGINE ----------
export { aiRouter } from "./ai/aiRouter.js";
export { callLiveLoop } from "./ai/callLiveLoop.js";
export { createAiCallSession } from "./ai/createAiCallSession.js";
export { summarizeAiSession } from "./ai/summarizeSession.js";
export { endAiCall } from "./ai/endAiCall.js";
// ---------- REAL-TIME CALLS & TOKENS ----------
export { createCallToken } from "./rtc/createCallToken.js";
export { createCallSession } from "./calls/createCallSession.js";
export { inviteToCall } from "./calls/inviteToCall.js";
export { joinExistingCall } from "./calls/joinExistingCall.js";
export { updateLayoutMode } from "./calls/updateLayoutMode.js";
export { endCallRoom } from "./calls/endCallRoom.js";
// ---------- VOICE & UPLOADS ----------
export { uploadVoice } from "./uploads/uploadVoice.js";
export { onVoiceUpload } from "./uploads/onVoiceUpload.js";
export { createVoiceCloneV2 } from "./voice/createVoiceCloneV2.js";
// ---------- FINANCE & MARKETPLACE ----------
export { sendWalletTransfer } from "./finance/sendWalletTransfer.js";
export { onWithdrawalApproved } from "./payouts/processWithdrawals.js";
export { createEscrowOnOrder } from "./marketplace/createEscrowOnOrder.js";
export { verifyAndReleaseEscrow } from "./marketplace/verifyAndReleaseEscrow.js";
export { onOrderStatusChange } from "./marketplace/onOrderStatusChange.js";
export { onFeedbackCreated } from "./marketplace/onFeedbackCreated.js";
// ---------- SOCIAL & CONTENT ----------
export { seeddemo } from "./social/seeddemo.js";
export { schedulePublisher2 } from "./social/scheduler.js";
export { socialPoster2 } from "./social/socialPoster.js";
// ---------- TRUST & REWARDS ----------
export { updateAgentRanks } from "./trust/updateAgentRanks.js";
export { vendorOptimizer } from "./vendorOptimizer.js";
export { redeemReward } from "./rewards/redeemReward.js";
// ---------- SEEDING ----------
export { initializeDemoData } from "./seed/initializeDemoData.js";
