
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Retrieves the per-second cost in credits for a user based on their plan.
 * @param uid The user's ID.
 * @returns The cost in credits per second.
 */
export async function getRateForPlan(uid: string): Promise<number> {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) throw new Error(`User ${uid} not found.`);
  
  const plan = userSnap.data()?.plan || "free";
  
  // These rates should eventually come from a 'plans' collection in Firestore
  const rates: Record<string, number> = {
    free: 0.15,
    starter: 0.12,
    pro: 0.10,
    vip: 0.08,
  };
  
  return rates[plan] || rates.free;
}

/**
 * Checks if a user has sufficient credits in their wallet.
 * @param uid The user's ID.
 * @param requiredAmount The minimum number of credits required.
 * @returns True if the user has enough credits, false otherwise.
 */
export async function hasSufficientCredits(uid: string, requiredAmount: number): Promise<boolean> {
  const walletRef = db.collection("wallets").doc(uid);
  const walletSnap = await walletRef.get();
  
  if (!walletSnap.exists) return false;
  
  const currentCredits = walletSnap.data()?.credits || 0;
  return currentCredits >= requiredAmount;
}

/**
 * Deducts a specified amount of credits from a user's wallet within a transaction.
 * @param uid The user's ID.
 * @param amount The number of credits to deduct.
 * @throws Throws an error if the transaction fails.
 */
export async function deductCredits(uid: string, amount: number): Promise<void> {
  const walletRef = db.collection("wallets").doc(uid);

  try {
    await db.runTransaction(async (transaction) => {
      const walletSnap = await transaction.get(walletRef);
      if (!walletSnap.exists) {
        throw new Error("Wallet not found.");
      }
      
      const currentCredits = walletSnap.data()?.credits || 0;
      if (currentCredits < amount) {
        throw new Error("Insufficient credits.");
      }
      
      transaction.update(walletRef, {
        credits: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    console.error(`Failed to deduct ${amount} credits from user ${uid}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}
