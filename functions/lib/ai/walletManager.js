"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletManager = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
exports.walletManager = (0, firestore_1.onDocumentUpdated)("wallet/{uid}", async (event) => {
    const after = event.data?.after.data();
    if (!after)
        return;
    if ((after.balance ?? 0) < 0) {
        await event.data?.after.ref.update({ balance: 0 });
    }
});
//# sourceMappingURL=walletManager.js.map