
'use client';

import { Auth, onAuthStateChanged, User } from "firebase/auth";
import { 
  Firestore,
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const ensureUserDoc = async (firestore: Firestore, user: User) => {
  if (!user) return;

  const userRef = doc(firestore, "users", user.uid);
  
  // Use a single getDoc call to check for existence.
  const userSnap = await getDoc(userRef);

  // 1️⃣ Create user profile if missing
  if (!userSnap.exists()) {
    console.log("Initializing documents for new user:", user.uid);
    try {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "New User",
        handle: user.email?.split('@')[0] || `user_${user.uid.slice(0, 6)}`,
        phone: user.phoneNumber || null,
        email: user.email || null,
        photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
        bio: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
        wallet: {
            balance: 10,
            escrow: 0,
            plan: {
                id: 'trial',
                credits: 10,
            },
            lastDeduction: null,
            lastTrialReset: serverTimestamp(),
        },
      });
      console.log("✅ User profile initialized.");

      // 2️⃣ Create wallet
      const walletRef = doc(firestore, "wallets", user.uid);
      await setDoc(walletRef, {
        agentId: user.uid,
        balanceTZS: 20000, // Default starting balance
        earnedToday: 0,
        totalEarnings: 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log("✅ Wallet initialized.");

      // 3️⃣ Create buyerTrust
      const trustRef = doc(firestore, "buyerTrust", user.uid);
      await setDoc(trustRef, {
        buyerId: user.uid,
        trustScore: 70, // Start with a neutral score
        level: 'Bronze',
        lastUpdated: serverTimestamp(),
        metrics: {
            onTimePayments: 0,
            latePayments: 0,
            refundsRequested: 0,
            positiveFeedback: 0,
            negativeFeedback: 0
        }
      });
      console.log("✅ BuyerTrust initialized.");

    } catch (error) {
        console.error("❌ Error initializing user documents:", error);
    }
  }
};


/**
 * Initializes a listener for the user's authentication state.
 * When a user signs in, it checks if they are new or existing and provisions
 * necessary Firestore documents accordingly.
 * 
 * @param auth The Firebase Auth instance.
 * @param db The Firestore instance.
 */
export const initUserSession = (auth: Auth, db: Firestore) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("✅ Auth state changed. User detected:", user.email || user.phoneNumber);
      await ensureUserDoc(db, user); // 🔥 Create missing docs automatically
    } else {
      console.log("🚪 No user signed in.");
    }
  });
};
