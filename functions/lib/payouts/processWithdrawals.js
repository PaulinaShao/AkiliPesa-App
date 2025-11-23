import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase.js";
/**
 * Admin marks withdrawal as approved.
 * Deduct from platform wallet and create payout record.
 */
export const onWithdrawalApproved = onCall({ region: "us-central1" }, async (request) => {
    const auth = request.auth;
    if (!auth)
        throw new HttpsError("unauthenticated", "Sign-in required.");
    const { withdrawalId } = request.data || {};
    if (!withdrawalId)
        throw new HttpsError("invalid-argument", "withdrawalId required.");
    const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
    const withdrawalSnap = await withdrawalRef.get();
    if (!withdrawalSnap.exists)
        throw new HttpsError("not-found", "Withdrawal not found.");
    const data = withdrawalSnap.data();
    if (data.status !== "pending")
        throw new HttpsError("failed-precondition", "Not pending.");
    const amount = Number(data.amount);
    const uid = data.userId;
    const platformRef = db.collection("wallets").doc("platform");
    await db.runTransaction(async (tx) => {
        const platformSnap = await tx.get(platformRef);
        const platformBalance = platformSnap.data()?.balanceTZS || 0;
        if (platformBalance < amount)
            throw new HttpsError("failed-precondition", "Platform low balance.");
        const now = admin.firestore.FieldValue.serverTimestamp();
        tx.update(platformRef, {
            balanceTZS: platformBalance - amount,
            updatedAt: now,
        });
        tx.update(withdrawalRef, {
            status: "completed",
            completedAt: now,
        });
        tx.set(db.collection("payouts").doc(), {
            uid,
            withdrawalId,
            amount,
            status: "completed",
            createdAt: now,
        });
    });
    return { ok: true };
});
