
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

/**
 * Trigger on new sale creation
 * Calculates and distributes commissions to agent and potentially a referrer.
 */
export const onSaleCreated = onDocumentCreated("sales/{saleId}", async (event) => {
    const saleData = event.data?.data();
    if (!saleData) {
        console.log("No data associated with the event.");
        return;
    }

    const { agentId, type, amount, referrerId } = saleData;
    if (!agentId || !type || !amount) {
        console.log(`Missing required fields in sale doc: ${event.params.saleId}`);
        return;
    }

    // Fetch commission rates from a single admin config document
    const configDoc = await admin.firestore().doc("commissionRates/adminConfig").get();
    const config = configDoc.data();
    
    // Define default rates and allow overrides from config
    const productRate = config?.productCommission ?? 0.8; // 80% to agent
    const serviceRate = config?.serviceCommission ?? 0.6; // 60% to agent
    const referralRate = config?.referralCommission ?? 0.1; // 10% to referrer

    let agentCommissionRate = 0;
    if (type === "product") agentCommissionRate = productRate;
    if (type === "service") agentCommissionRate = serviceRate;

    const referralEarning = referrerId ? amount * referralRate : 0;
    // Agent gets their share of the remainder after referrer cut
    const agentEarning = (amount - referralEarning) * agentCommissionRate;

    const batch = admin.firestore().batch();

    // 1. Update Agent's Wallet & Stats
    if (agentEarning > 0) {
        const agentWalletRef = admin.firestore().collection("wallets").doc(agentId);
        batch.set(agentWalletRef, {
            balanceTZS: admin.firestore.FieldValue.increment(agentEarning),
            totalEarnings: admin.firestore.FieldValue.increment(agentEarning),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Log transaction for the agent
        const agentTxRef = admin.firestore().collection("walletTransactions").doc();
        batch.set(agentTxRef, {
            agentId: agentId,
            saleId: event.params.saleId,
            amount: agentEarning,
            type: "credit",
            source: "sale_commission",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            description: `Commission from ${type} sale`
        });
    }

    // 2. Update Referrer's Wallet & Stats (if applicable)
    if (referralEarning > 0 && referrerId) {
        const referrerWalletRef = admin.firestore().collection("wallets").doc(referrerId);
        batch.set(referrerWalletRef, {
            balanceTZS: admin.firestore.FieldValue.increment(referralEarning),
            totalEarnings: admin.firestore.FieldValue.increment(referralEarning),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Log transaction for the referrer
        const referrerTxRef = admin.firestore().collection("walletTransactions").doc();
        batch.set(referrerTxRef, {
            agentId: referrerId,
            saleId: event.params.saleId,
            amount: referralEarning,
            type: "credit",
            source: "referral_commission",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            description: `Referral commission from sale by ${agentId}`
        });

        // Update referral stats
        const referralStatsRef = admin.firestore().collection("referrals").doc(referrerId);
        batch.set(referralStatsRef, {
            totalReferrals: admin.firestore.FieldValue.increment(1),
            lastEarned: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    await batch.commit();
    console.log(`✅ Commissions distributed for sale ${event.params.saleId}. Agent: ${agentEarning}, Referrer: ${referralEarning}`);
});
