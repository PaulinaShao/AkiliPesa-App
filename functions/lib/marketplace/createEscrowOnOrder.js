import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase/index.js";
/**
 * Create escrow for new order
 */
export const createEscrowOnOrder = onCall({ region: "us-central1" }, async (request) => {
    const { orderId, amount, buyerId, sellerId } = request.data || {};
    if (!orderId || !buyerId || !sellerId)
        throw new HttpsError("invalid-argument", "Missing order params.");
    const escrowRef = db
        .collection("orders")
        .doc(orderId)
        .collection("escrow")
        .doc("escrow");
    await escrowRef.set({
        orderId,
        buyerId,
        sellerId,
        amount,
        status: "held",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
