
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
const db = admin.firestore();

export const vendorOptimizer = onSchedule("every day 02:00", async () => {
  // Example: Calculate simple preference based on last 7 days profit per vendor
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const snap = await db.collection("profit_tracking")
    .where("created_at", ">=", since)
    .get();

  const agg: Record<string, { revenue: number; cost: number; count: number }> = {};
  snap.forEach((d) => {
    const v = d.data();
    const key = v.vendor || "unknown";
    agg[key] ||= { revenue: 0, cost: 0, count: 0 };
    agg[key].revenue += v.revenue || 0;
    agg[key].cost += v.cost || 0;
    agg[key].count += 1;
  });

  const ranked = Object.entries(agg).map(([k, v]) => ({
    vendor: k,
    margin: v.revenue - v.cost,
    marginPerReq: (v.revenue - v.cost) / Math.max(1, v.count),
  })).sort((a, b) => b.marginPerReq - a.marginPerReq);

  await db.collection("settings").doc("routingWeights").set({
    ranked,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log("✅ vendorOptimizer ranking updated", ranked.slice(0, 5));
});
