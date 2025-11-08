import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
/**
 * SMART REAL-TIME PAYOUT MANAGER
 * Handles: sales, escrow releases, commissions, and direct transaction credits.
 */
export const realtimePayoutManager = functions.firestore
    .document("{collectionId}/{docId}")
    .onWrite(async (change, context) => {
    const { collectionId } = context.params;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    if (!after)
        return null;
    // 🔒 Prevent recursive triggers from our own updates
    if (["wallets", "walletTransactions"].includes(collectionId))
        return null;
    const validSourceCollections = ["sales", "transactions", "escrow", "commissions"];
    if (!validSourceCollections.includes(collectionId))
        return null;
    let targetUid = after.uid || after.sellerId || after.agentId || after.userId;
    let amount = 0;
    let reason = "";
    // 1️⃣ Completed sale
    if (collectionId === "sales" && after.status === "completed" && before?.status !== "completed") {
        targetUid = after.agentId || after.sellerId;
        amount = after.amount || 0;
        reason = "Completed Sale Payout";
    }
    // 2️⃣ Escrow release
    if (collectionId === "escrow" && before?.status !== "released" && after.status === "released") {
        targetUid = after.sellerId;
        amount = after.amount || 0;
        reason = "Escrow Released";
        // Handle referral commission from escrow release
        if (after.referrerId && after.referralCommission > 0) {
            await creditWallet(after.referrerId, after.referralCommission, "Referral Commission");
        }
    }
    // 3️⃣ Commission increase
    if (collectionId === "commissions" && before) {
        const delta = (after.totalEarnings || 0) - (before.totalEarnings || 0);
        if (delta > 0) {
            targetUid = after.uid;
            amount = delta;
            reason = "Commission Credit";
        }
    }
    // 4️⃣ Manual transaction credit
    if (collectionId === "transactions" && after.type === "credit" && !before) { // Only on create
        targetUid = after.uid;
        amount = after.amount || 0;
        reason = "Transaction Credit";
    }
    if (!targetUid || amount <= 0)
        return null;
    await creditWallet(targetUid, amount, reason);
    console.log(`💰 [PAYOUT] ${reason} +${amount} → ${targetUid}`);
    return null;
});
async function creditWallet(uid, amount, description) {
    if (!uid || !amount || amount <= 0)
        return;
    const walletRef = db.collection("wallets").doc(uid);
    const txRef = db.collection("walletTransactions").doc(); // Use a different collection to avoid recursion
    // Ensure wallet exists before trying to increment
    const walletSnap = await walletRef.get();
    if (!walletSnap.exists) {
        await walletRef.set({
            balanceTZS: 0,
            totalEarnings: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    const batch = db.batch();
    batch.set(walletRef, {
        balanceTZS: admin.firestore.FieldValue.increment(amount),
        totalEarnings: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(txRef, {
        txId: txRef.id,
        agentId: uid, // Use a consistent field name like agentId
        amount,
        type: "credit",
        source: description.toLowerCase().replace(/ /g, '_'),
        description,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    console.log(`✅ Wallet +${amount} TZS synced for ${uid}`);
}
//# sourceMappingURL=realtimePayoutManager.js.map