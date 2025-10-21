
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

/**
 * Auto-initialize user-related Firestore data after first login.
 * Creates:
 *  - /users/{uid}
 *  - /wallets/{uid}
 *  - /buyerTrust/{uid}
 *  - /users/{uid}/clones/{cloneId}
 *  - /users/{uid}/agents/{agentId}
 */
export const ensureUserDoc = async (firestore: Firestore, user: User) => {
  if (!user) return;

  const uid = user.uid;
  const displayName = user.displayName || "New User";

  const userRef = doc(firestore, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.log("Initializing documents for new user:", uid);
    try {
      // 1️⃣ USER PROFILE
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
      const cloneRef = doc(firestore, "users", uid, "clones", `clone_${uid.slice(0, 5)}`);
      await setDoc(cloneRef, {
          cloneId: `clone_${uid.slice(0, 5)}`,
          userId: uid,
          name: `${displayName}'s AI Clone`,
          description: "Your personalized AI avatar for voice, face & chat.",
          avatarUrl: "/assets/default-avatar-tanzanite.svg",
          type: 'face',
          voiceModelUrl: "akilipesa_default_voice",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      });
      console.log("🤖 Default AI Clone initialized");

      // 5️⃣ DEFAULT AGENT (Sales/Support Assistant)
      const agentRef = doc(firestore, "users", uid, "agents", `agent_${uid.slice(0, 5)}`);
      await setDoc(agentRef, {
        agentId: `agent_${uid.slice(0, 5)}`,
        uid,
        name: `${displayName}'s Agent`,
        role: "Sales & Support Assistant",
        description: "Your AI-powered agent to assist customers and manage inquiries.",
        avatarUrl: "/images/default-agent.png",
        specialty: ["sales", "support", "community"],
        tone: "helpful",
        status: "active",
        responseSpeed: "normal",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("🧠 Default AI Agent initialized");

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
