// functions/src/marketplace/createOrder.ts
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const createOrder = onCall(async (req) => {
  const { buyerId, sellerId, amount } = req.data;

  const ref = await admin.firestore().collection("orders").add({
    buyerId,
    sellerId,
    amount,
    status: "pending",
    createdAt: new Date(),
  });

  return { orderId: ref.id };
});
