/**
 * Run this after running backfillTransactionsUid.ts
 * Recalculates each user's wallet balance and escrow totals based on their transactions.
 * Safe to run multiple times — updates are idempotent.
 */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import { firebaseConfig } from "../src/firebase/config";


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

async function recalcWallets() {
  console.log("🔍 Fetching all transactions...");
  const txSnap = await getDocs(collection(db, "transactions"));
  const walletTotals: Record<string, { balance: number; escrow: number }> = {};

  txSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.uid || typeof data.amount !== "number") return;

    if (!walletTotals[data.uid]) walletTotals[data.uid] = { balance: 0, escrow: 0 };

    if (data.status === "completed" || data.status === "Completed") {
      // Handle both uppercase and lowercase status
      walletTotals[data.uid].balance += data.amount;
    } else if (data.status === "escrowed" || data.status === "Escrow Hold") {
      walletTotals[data.uid].escrow += data.amount;
    }
  });

  console.log(`📊 Calculating balances for ${Object.keys(walletTotals).length} users...`);
  const batch = writeBatch(db);

  for (const [uid, totals] of Object.entries(walletTotals)) {
    const walletRef = doc(db, "wallets", uid);
    batch.set(walletRef, {
      balance: totals.balance,
      escrow: totals.escrow,
      updatedAt: new Date(),
    }, { merge: true });
  }

  await batch.commit();
  console.log("✅ Wallet recalculation complete.");
}

recalcWallets().catch(console.error).then(() => {
    console.log("Script finished. Exiting.");
    process.exit(0);
});
