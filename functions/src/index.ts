/**
 * Master Functions Export Index
 * Clean, modular, Firebase Studio–friendly
 */

import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2/options";

if (!admin.apps.length) admin.initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

// ----------------- AI CALL SYSTEM -----------------
export { createAiCallSession } from "./ai/createAiCallSession";
export { enqueueTTS } from "./ai/callSessionHandler";
export { callLiveLoop } from "./ai/callLiveLoop";
export { endAiCall } from "./ai/endAiCall";
export { summarizeAiSession } from "./ai/summarizeSession";

// ----------------- REAL-TIME CALL ROUTING -----------------
export { inviteToCall } from "./calls/inviteToCall";
export { joinExistingCall } from "./calls/joinExistingCall";
export { updateLayoutMode } from "./calls/updateLayoutMode";
export { endCallRoom } from "./calls/endCallRoom";

// ----------------- MARKETPLACE & TRANSACTIONS -----------------
export { onWithdrawalApproved } from "./payouts/processWithdrawal";
export { onProductSaleReward, onReferralReward, onAIInteractionReward } from "./rewards/awardPoints";
export { redeemReward } from "./rewards/redeemReward";
export { createEscrowOnOrder, verifyAndReleaseEscrow } from "./marketplace/escrow";
export { onOrderStatusChange } from "./marketplace/orders";
export { onFeedbackCreated } from "./marketplace/feedback";

// ----------------- POSTING & SOCIAL -----------------
export { seeddemo } from "./social/seeddemo";
export { schedulePublisher2 } from "./social/scheduler";
export { socialPoster2 } from "./social/socialPoster";

// ----------------- TRUST SCORES -----------------
export { updateAgentRanks } from "./trust/updateAgentRanks";

// ----------------- STORAGE UPLOAD PROCESSORS -----------------
export { onVoiceUpload } from "./uploads/onVoiceUpload";

// ----------------- CALL ADAPTER (AGORA / ZEGO) -----------------
export { getAgoraToken } from "./rtc/agora";
