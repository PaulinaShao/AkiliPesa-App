
'use client';

import { Auth, onAuthStateChanged, User } from "firebase/auth";
import { 
  Firestore,
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";

export const ensureUserDoc = async (firestore: Firestore, user: User) => {
  if (!user) return;

  const uid = user.uid;
  const displayName = user.displayName || "New User";

  // 1️⃣ USER PROFILE
  const userRef = doc(firestore, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.log("Initializing documents for new user:", uid);
    try {
      await setDoc(userRef, {
        uid,
        displayName,
        handle: user.email?.split('@')[0] || `user_${uid.slice(0, 6)}`,
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

      // 2️⃣ WALLET
      const walletRef = doc(firestore, "wallets", uid);
      await setDoc(walletRef, {
        agentId: uid,
        balanceTZS: 20000,
        earnedToday: 0,
        totalEarnings: 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log("✅ Wallet initialized.");

      // 3️⃣ TRUST SCORE
      const trustRef = doc(firestore, "buyerTrust", uid);
      await setDoc(trustRef, {
        buyerId: uid,
        trustScore: 70,
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
      
      // 4️⃣ DEFAULT AI CLONE
      const cloneCollectionRef = collection(firestore, "users", uid, "clones");
      const defaultCloneId = `clone_${uid.slice(0, 5)}`;
      const defaultCloneDocRef = doc(cloneCollectionRef, defaultCloneId);
      
      await setDoc(defaultCloneDocRef, {
          cloneId: defaultCloneId,
          userId: uid,
          name: `${displayName}'s AI Clone`,
          description: "Your personalized AI avatar for voice, face & chat.",
          avatarUrl: "/assets/default-avatar-tanzanite.svg",
          type: 'face', // Defaulting to face, can be changed
          voiceModelUrl: "akilipesa_default_voice",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      });
      console.log("🤖 Default AI Clone initialized");

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
