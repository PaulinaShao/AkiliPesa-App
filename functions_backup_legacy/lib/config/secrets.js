"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGORA_APP_CERT = exports.AGORA_APP_ID = exports.LUMA_API_KEY = exports.STABILITY_API_KEY = exports.RUNWAY_API_KEY = exports.RUNPOD_API_KEY = exports.OPENAI_API_KEY = void 0;
const params_1 = require("firebase-functions/params");
exports.OPENAI_API_KEY = (0, params_1.defineSecret)("OPENAI_API_KEY");
exports.RUNPOD_API_KEY = (0, params_1.defineSecret)("RUNPOD_API_KEY");
exports.RUNWAY_API_KEY = (0, params_1.defineSecret)("RUNWAY_API_KEY");
exports.STABILITY_API_KEY = (0, params_1.defineSecret)("STABILITY_API_KEY");
exports.LUMA_API_KEY = (0, params_1.defineSecret)("LUMA_API_KEY");
exports.AGORA_APP_ID = (0, params_1.defineSecret)("AGORA_APP_ID");
exports.AGORA_APP_CERT = (0, params_1.defineSecret)("AGORA_APP_CERT");
//# sourceMappingURL=secrets.js.map