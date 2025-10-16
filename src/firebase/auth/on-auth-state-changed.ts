
'use client';

import { Auth, onAuthStateChanged } from "firebase/auth";
import { 
  Firestore,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  FieldValue, 
  serverTimestamp
} from "firebase/firestore";

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
    if (!user) {
      console.log("User is signed out.");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log("✅ Existing user detected:", user.email);
    } else {
      console.log("🆕 New user detected, creating records for:", user.email);
      
      const newUserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email,
        phone: user.phoneNumber || "",
        photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
        handle: user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        plan: {
            id: 'trial',
            credits: 10,
        },
        wallet: {
            balance: 10,
            escrow: 0,
        },
        stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
        totalReferrals: 0,
        totalCommissions: 0,
      };

      const walletRef = doc(collection(db, "wallets"), user.uid);
      const referralRef = doc(collection(db, "referrals"), user.uid);
      const commissionRef = doc(collection(db, "commissions"), user.uid);

      try {
        await setDoc(userRef, newUserProfile);
        
        await Promise.all([
          setDoc(walletRef, {
            balance: 0,
            escrow: 0,
            updatedAt: serverTimestamp(),
          }),
          setDoc(referralRef, {
            referredBy: null,
            referredUsers: [],
            totalEarned: 0,
            lastUpdated: serverTimestamp(),
          }),
          setDoc(commissionRef, {
            totalSales: 0,
            totalEarnings: 0,
            pending: 0,
            lastUpdated: serverTimestamp(),
          }),
        ]);
        console.log(`✅ Successfully created all records for new user ${user.uid}`);
      } catch (error) {
        console.error("❌ Error creating records for new user:", error);
      }
    }
  });
};
