"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceTransactionLimits = void 0;
// functions/src/finance/enforceTransactionLimits.ts
const https_1 = require("firebase-functions/v2/https");
/**
 * Placeholder callable for checking daily/monthly transaction limits.
 * Currently just returns ok:true so it doesn't block anything.
 * You can plug in real logic later.
 */
exports.enforceTransactionLimits = (0, https_1.onCall)({ region: "us-central1" }, async () => {
    // TODO: implement real limits
    return { ok: true };
});
//# sourceMappingURL=enforceTransactionLimits.js.map