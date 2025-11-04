
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Daily scheduled job to aggregate vendor metrics and update routing weights.
 */
export const vendorOptimizer = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    console.log('Starting vendor optimization job...');

    // 1. TODO: Aggregate data from `profit_tracking` and `ai_requests`
    const profitSnapshot = await db.collection('profit_tracking').get();
    const requestsSnapshot = await db.collection('ai_requests').get();

    const metrics: { [key: string]: { totalProfit: number, totalCost: number, successCount: number, totalCount: number, totalLatency: number } } = {};

    profitSnapshot.forEach(doc => {
        const data = doc.data();
        if (!metrics[data.vendor]) {
            metrics[data.vendor] = { totalProfit: 0, totalCost: 0, successCount: 0, totalCount: 0, totalLatency: 0 };
        }
        metrics[data.vendor].totalProfit += data.profit;
        metrics[data.vendor].totalCost += data.cost;
    });
    
    // This is a simplified latency calculation. A real implementation would be more robust.
     requestsSnapshot.forEach(doc => {
        const data = doc.data();
        if (metrics[data.vendor_used]) {
            metrics[data.vendor_used].totalCount++;
            if(data.status === 'success') {
                metrics[data.vendor_used].successCount++;
                const latency = data.updated_at.toMillis() - data.created_at.toMillis();
                metrics[data.vendor_used].totalLatency += latency;
            }
        }
    });

    // 2. TODO: Calculate new metrics and update `vendor_metrics` collection
    const batch = db.batch();
    for (const vendorName in metrics) {
        const m = metrics[vendorName];
        const avgCost = m.totalCost / m.totalCount || 0;
        const successRate = m.totalCount > 0 ? m.successCount / m.totalCount : 0;
        const avgLatency = m.successCount > 0 ? m.totalLatency / m.successCount : 0;
        
        const vendorRef = db.collection('vendor_metrics').doc(vendorName);
        batch.set(vendorRef, {
            vendor_name: vendorName,
            avg_cost: avgCost,
            success_rate: successRate,
            latency_ms: avgLatency,
            last_used: admin.firestore.FieldValue.serverTimestamp() // Represents last aggregation
        }, { merge: true });
    }
    
    await batch.commit();
    console.log(`Vendor optimization complete. Updated metrics for ${Object.keys(metrics).length} vendors.`);
    
    // 3. TODO: Update routing weights in Remote Config or a Firestore doc
    // This part is highly dependent on the `selectVendor` implementation.
    
    return null;
});
