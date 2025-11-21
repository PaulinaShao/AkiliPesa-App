/**
 * Recalculates balances & escrow totals from all transactions
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch
} from "firebase/firestore";
import { firebaseConfig } from "../src/firebase/config";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function recalc() {
  console.log("🔍 Fetching transactions...");
  const txSnap = await getDocs(collection(db, "transactions"));

  const totals: Record<
    string,
    { balance: number; escrow: number; callCredits: number }
  > = {};

  txSnap.forEach((d) => {
    const tx = d.data();
    if (!tx.uid) return;

    if (!totals[tx.uid]) {
      totals[tx.uid] = { balance: 0, escrow: 0, callCredits: 0 };
    }

    if (tx.status === "completed") totals[tx.uid].balance += tx.amount;
    else if (tx.status === "escrowed") totals[tx.uid].escrow += tx.amount;
    else if (tx.type === "callCredit") totals[tx.uid].callCredits += tx.amount;
  });

  const batch = writeBatch(db);
  for (const [uid, t] of Object.entries(totals)) {
    batch.set(
      doc(db, "wallets", uid),
      {
        balanceTZS: t.balance,
        escrow: t.escrow,
        credits: { calls: t.callCredits }
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log("✅ Wallet recalculation complete");
}

recalc().finally(() => process.exit(0));
