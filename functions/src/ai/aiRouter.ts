import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { selectVendor, callVendor, estimateCost, computeUserPrice } from "./adapters/selector";

const db = admin.firestore();

export const aiRouter = onCall(async (req) => {
  if (!req.auth) throw new Error("Unauthenticated");
  const { uid } = req.auth;
  const { requestType, input, options = {} } = req.data || {};
  if (!requestType || !input) throw new Error("Missing parameters");

  // Load user profile (plan & wallet)
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error("User not found");
  const user = userSnap.data()!;
  const plan = user.plan || "free";
  const wallet = user.wallet_balance ?? 0;

  // Pick vendor based on plan, wallet, requestType, quality/cost
  const vendor = selectVendor({ requestType, plan, wallet });
  const rawCost = estimateCost(vendor, requestType, options);
  const priceToUser = computeUserPrice(rawCost, plan);

  if (wallet < priceToUser) {
    // Optional: create an ai_requests record with “insufficient_funds”
    throw new Error("Insufficient balance, please top-up or downgrade quality.");
  }

  // Create request record for streaming status
  const reqRef = db.collection("ai_requests").doc();
  const requestId = reqRef.id;
  await reqRef.set({
    uid,
    type: requestType,
    input,
    options,
    vendor_used: vendor.name,
    cost: rawCost,
    price_charged: priceToUser,
    status: "running",
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Execute vendor adapter
  const result = await callVendor(vendor, { input, options, uid, requestId });

  // Persist output, deduct wallet, and log profit atomically
  await db.runTransaction(async (t) => {
    const u = await t.get(userRef);
    const currentBalance = (u.data()?.wallet_balance ?? 0);

    if (currentBalance < priceToUser) {
      t.update(reqRef, { status: "failed", error: "Insufficient funds at charge time" });
      throw new Error("Insufficient funds during charge");
    }

    t.update(userRef, { wallet_balance: currentBalance - priceToUser });
    t.update(reqRef, {
      status: result.outputUrl ? "success" : "failed",
      output_url: result.outputUrl ?? null,
      error: result.error ?? null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    const profitRef = db.collection("profit_tracking").doc();
    t.set(profitRef, {
      uid,
      vendor: vendor.name,
      revenue: priceToUser,
      cost: rawCost,
      profit: Math.max(0, priceToUser - rawCost),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Basic vendor metrics update (avg/usage)
    const vmRef = db.collection("vendor_metrics").doc(vendor.name);
    t.set(vmRef, {
      vendor_name: vendor.name,
      last_used: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return {
    status: result.outputUrl ? "success" : "failed",
    vendor_used: vendor.name,
    output_url: result.outputUrl || null,
    request_id: requestId,
  };
});
