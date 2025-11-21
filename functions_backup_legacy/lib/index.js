"use strict";
// functions/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgoraToken = exports.dispatchQueuedNotifications = exports.onTransactionCreated = exports.onWalletUpdated = exports.onVoiceUpload = exports.updateAgentRanks = exports.socialPoster2 = exports.schedulePublisher2 = exports.seeddemo = exports.sendWalletTransfer = exports.onFeedbackCreated = exports.onOrderStatusChange = exports.verifyAndReleaseEscrow = exports.createEscrowOnOrder = exports.redeemReward = exports.onAIInteractionReward = exports.onReferralReward = exports.onProductSaleReward = exports.onWithdrawalApproved = exports.createCallToken = exports.createCallSession = exports.endCallRoom = exports.updateLayoutMode = exports.joinExistingCall = exports.inviteToCall = exports.summarizeAiSession = exports.endAiCall = exports.callLiveLoop = exports.processTTSQueue = exports.createAiCallSession = void 0;
/**
 * Master Functions Export Index
 * Clean, modular, Firebase Studio–friendly
 */
const admin = __importStar(require("firebase-admin"));
const options_1 = require("firebase-functions/v2/options");
if (!admin.apps.length)
    admin.initializeApp({
        storageBucket: "akilipesacustomize-70486-65934.firebasestorage.app"
    });
;
(0, options_1.setGlobalOptions)({ region: "us-central1", maxInstances: 10 });
// ----------------- AI CALL SYSTEM -----------------
var createAiCallSession_1 = require("./ai/createAiCallSession");
Object.defineProperty(exports, "createAiCallSession", { enumerable: true, get: function () { return createAiCallSession_1.createAiCallSession; } });
var callSessionHandler_1 = require("./ai/callSessionHandler");
Object.defineProperty(exports, "processTTSQueue", { enumerable: true, get: function () { return callSessionHandler_1.processTTSQueue; } });
var callLiveLoop_1 = require("./ai/callLiveLoop");
Object.defineProperty(exports, "callLiveLoop", { enumerable: true, get: function () { return callLiveLoop_1.callLiveLoop; } });
var endAiCall_1 = require("./ai/endAiCall");
Object.defineProperty(exports, "endAiCall", { enumerable: true, get: function () { return endAiCall_1.endAiCall; } });
var summarizeSession_1 = require("./ai/summarizeSession");
Object.defineProperty(exports, "summarizeAiSession", { enumerable: true, get: function () { return summarizeSession_1.summarizeAiSession; } });
// ----------------- REAL-TIME CALL ROUTING -----------------
var inviteToCall_1 = require("./calls/inviteToCall");
Object.defineProperty(exports, "inviteToCall", { enumerable: true, get: function () { return inviteToCall_1.inviteToCall; } });
var joinExistingCall_1 = require("./calls/joinExistingCall");
Object.defineProperty(exports, "joinExistingCall", { enumerable: true, get: function () { return joinExistingCall_1.joinExistingCall; } });
var updateLayoutMode_1 = require("./calls/updateLayoutMode");
Object.defineProperty(exports, "updateLayoutMode", { enumerable: true, get: function () { return updateLayoutMode_1.updateLayoutMode; } });
var endCallRoom_1 = require("./calls/endCallRoom");
Object.defineProperty(exports, "endCallRoom", { enumerable: true, get: function () { return endCallRoom_1.endCallRoom; } });
var createCallSession_1 = require("./calls/createCallSession");
Object.defineProperty(exports, "createCallSession", { enumerable: true, get: function () { return createCallSession_1.createCallSession; } });
var createCallToken_1 = require("./calls/createCallToken");
Object.defineProperty(exports, "createCallToken", { enumerable: true, get: function () { return createCallToken_1.createCallToken; } });
// ----------------- MARKETPLACE & TRANSACTIONS -----------------
var processWithdrawals_1 = require("./payouts/processWithdrawals");
Object.defineProperty(exports, "onWithdrawalApproved", { enumerable: true, get: function () { return processWithdrawals_1.onWithdrawalApproved; } });
var awardPoints_1 = require("./rewards/awardPoints");
Object.defineProperty(exports, "onProductSaleReward", { enumerable: true, get: function () { return awardPoints_1.onProductSaleReward; } });
Object.defineProperty(exports, "onReferralReward", { enumerable: true, get: function () { return awardPoints_1.onReferralReward; } });
Object.defineProperty(exports, "onAIInteractionReward", { enumerable: true, get: function () { return awardPoints_1.onAIInteractionReward; } });
var redeemReward_1 = require("./rewards/redeemReward");
Object.defineProperty(exports, "redeemReward", { enumerable: true, get: function () { return redeemReward_1.redeemReward; } });
var escrow_1 = require("./marketplace/escrow");
Object.defineProperty(exports, "createEscrowOnOrder", { enumerable: true, get: function () { return escrow_1.createEscrowOnOrder; } });
Object.defineProperty(exports, "verifyAndReleaseEscrow", { enumerable: true, get: function () { return escrow_1.verifyAndReleaseEscrow; } });
var orders_1 = require("./marketplace/orders");
Object.defineProperty(exports, "onOrderStatusChange", { enumerable: true, get: function () { return orders_1.onOrderStatusChange; } });
var feedback_1 = require("./marketplace/feedback");
Object.defineProperty(exports, "onFeedbackCreated", { enumerable: true, get: function () { return feedback_1.onFeedbackCreated; } });
// ✅ NEW: Wallet transfer (finance)
var sendWalletTransfer_1 = require("./finance/sendWalletTransfer");
Object.defineProperty(exports, "sendWalletTransfer", { enumerable: true, get: function () { return sendWalletTransfer_1.sendWalletTransfer; } });
// ----------------- POSTING & SOCIAL -----------------
var seeddemo_1 = require("./social/seeddemo");
Object.defineProperty(exports, "seeddemo", { enumerable: true, get: function () { return seeddemo_1.seeddemo; } });
var scheduler_1 = require("./social/scheduler");
Object.defineProperty(exports, "schedulePublisher2", { enumerable: true, get: function () { return scheduler_1.schedulePublisher2; } });
var socialPoster_1 = require("./social/socialPoster");
Object.defineProperty(exports, "socialPoster2", { enumerable: true, get: function () { return socialPoster_1.socialPoster2; } });
// ----------------- TRUST SCORES -----------------
var updateAgentRanks_1 = require("./trust/updateAgentRanks");
Object.defineProperty(exports, "updateAgentRanks", { enumerable: true, get: function () { return updateAgentRanks_1.updateAgentRanks; } });
// ----------------- STORAGE UPLOAD PROCESSORS -----------------
var onVoiceUpload_1 = require("./uploads/onVoiceUpload");
Object.defineProperty(exports, "onVoiceUpload", { enumerable: true, get: function () { return onVoiceUpload_1.onVoiceUpload; } });
// ----------------- NOTIFICATIONS (wallet + transactions) -----------------
var dispatcher_1 = require("./notifications/dispatcher");
Object.defineProperty(exports, "onWalletUpdated", { enumerable: true, get: function () { return dispatcher_1.onWalletUpdated; } });
Object.defineProperty(exports, "onTransactionCreated", { enumerable: true, get: function () { return dispatcher_1.onTransactionCreated; } });
Object.defineProperty(exports, "dispatchQueuedNotifications", { enumerable: true, get: function () { return dispatcher_1.dispatchQueuedNotifications; } });
// ----------------- CALL ADAPTER (AGORA) -----------------
var agora_1 = require("./rtc/agora");
Object.defineProperty(exports, "getAgoraToken", { enumerable: true, get: function () { return agora_1.getAgoraToken; } });
//# sourceMappingURL=index.js.map