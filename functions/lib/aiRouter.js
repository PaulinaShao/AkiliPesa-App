"use strict";
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
exports.aiRouter = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// TODO: Import vendor selection logic and adapter functions
// import { selectVendor } from './vendorSelector';
// import * as openAIAdapter from './adapters/openai';
// import * as runwayAdapter from './adapters/runwayml';
const db = admin.firestore();
const storage = admin.storage();
/**
 * Main orchestration function.
 * - Parses intent, checks plan & wallet, selects vendor via profit-aware policy.
 * - Executes calls (async if needed), streams/logs, stores output, and deducts from wallet.
 */
exports.aiRouter = functions.https.onCall(async (data, context) => {
    // 1. Authenticate and validate the request
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { uid, requestType, input, options } = data;
    if (uid !== context.auth.uid || !requestType || !input) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters.');
    }
    // 2. Load user plan and wallet balance
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const user = userDoc.data();
    const { plan, wallet_balance } = user;
    // 3. Create a request document in Firestore to track progress
    const requestRef = db.collection('ai_requests').doc();
    await requestRef.set({
        uid,
        type: requestType,
        input,
        options,
        status: 'pending',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    // 4. TODO: Implement Vendor Selection Logic
    // This is where the core profit-aware routing happens.
    // const { vendor, estimatedCost } = selectVendor(requestType, plan, options);
    const vendor = 'mock_vendor';
    const estimatedCost = 1.0; // Placeholder
    const priceCharged = estimatedCost * 1.5; // Placeholder for pricing logic
    // 5. TODO: Check wallet balance against the charged price
    if (wallet_balance < priceCharged) {
        await requestRef.update({ status: 'failed', error: 'Insufficient funds.' });
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds. Please top up your wallet.');
    }
    await requestRef.update({
        status: 'running',
        vendor_used: vendor,
        cost: estimatedCost,
        price_charged: priceCharged,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    // 6. TODO: Execute the call to the chosen vendor's adapter
    let outputUrl = '';
    try {
        // const result = await someVendorAdapter.run(input, options);
        // outputUrl = result.outputUrl;
        // Simulate a long-running job
        await new Promise(resolve => setTimeout(resolve, 3000));
        outputUrl = `gs://${storage.bucket().name}/ai-outputs/${uid}/${requestRef.id}/mock_output.txt`;
        // 7. TODO: Store the output (if any) to Firebase Storage. This is a placeholder.
        await storage.bucket().file(outputUrl.replace(`gs://${storage.bucket().name}/`, '')).save('This is a mock output file.');
        await requestRef.update({
            status: 'success',
            output_url: outputUrl,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        await requestRef.update({
            status: 'failed',
            error: error.message,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError('internal', 'AI vendor processing failed.', error);
    }
    // 8. TODO: Deduct funds from wallet in a transaction
    const newBalance = wallet_balance - priceCharged;
    await db.collection('users').doc(uid).update({ wallet_balance: newBalance });
    // Also record profit
    await db.collection('profit_tracking').add({
        uid,
        vendor,
        revenue: priceCharged,
        cost: estimatedCost,
        profit: priceCharged - estimatedCost,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    // 9. Return the result to the client
    return {
        status: 'success',
        vendor_used: vendor,
        output_url: outputUrl,
        remaining_balance: newBalance,
        request_id: requestRef.id,
    };
});
//# sourceMappingURL=aiRouter.js.map