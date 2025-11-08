import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const db = admin.firestore();
/**
 * Firestore trigger to normalize wallet data and guard against inconsistencies.
 */
export const walletManager = functions.firestore
    .document('wallet/{uid}')
    .onWrite(async (change, context) => {
    const afterData = change.after.data();
    if (!change.after.exists || !afterData) {
        console.log(`Wallet for ${context.params.uid} deleted. No action taken.`);
        return null;
    }
    // Guard against negative balances
    if (afterData.balance < 0) {
        console.warn(`Negative balance detected for ${context.params.uid}. Correcting.`);
        // Create a corrective transaction to bring the balance back to zero.
        const correctionAmount = -afterData.balance;
        const correctiveTx = {
            amount: correctionAmount,
            type: 'correction',
            description: 'System correction for negative balance.',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        // Use a transaction to ensure atomicity
        const walletRef = db.collection('wallet').doc(context.params.uid);
        return db.runTransaction(async (transaction) => {
            transaction.update(walletRef, {
                balance: 0,
                transactions: admin.firestore.FieldValue.arrayUnion(correctiveTx),
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            });
        });
    }
    // TODO: Could add logic here to sync a summary to the main users/{uid} doc
    // for faster client-side reads, e.g., on an `onUpdate` event.
    return null;
});
//# sourceMappingURL=walletManager.js.map