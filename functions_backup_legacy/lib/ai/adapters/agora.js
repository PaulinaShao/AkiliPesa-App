"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgoraToken = void 0;
const secrets_1 = require("../../config/secrets");
const https_1 = require("firebase-functions/v2/https");
const agora_access_token_1 = require("agora-access-token");
exports.getAgoraToken = (0, https_1.onCall)({ secrets: [secrets_1.AGORA_APP_ID, secrets_1.AGORA_APP_CERT] }, async (req) => {
    const channelName = req.data?.channelName || `akili_${Date.now()}`;
    const expire = 3600;
    const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(secrets_1.AGORA_APP_ID.value(), secrets_1.AGORA_APP_CERT.value(), channelName, 0, agora_access_token_1.RtcRole.PUBLISHER, expire);
    return { appId: secrets_1.AGORA_APP_ID.value(), channelName, token };
});
//# sourceMappingURL=agora.js.map