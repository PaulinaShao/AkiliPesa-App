
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export const useAuthRedirect = () => {
  const router = useRouter();
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const [isCheckingDb, setIsCheckingDb] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return; 
    }

    if (!user) {
      router.replace("/auth/login");
      setIsCheckingDb(false);
      return;
    }

    const checkUserProfile = async () => {
      if (!firestore) return;
      
      try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // If the profile doesn't exist, the setup page will handle creation.
          // We just need to ensure we are on the setup page.
          if (window.location.pathname !== '/auth/setup') {
            router.replace("/auth/setup");
          }
        }
      } catch (err) {
        console.error("Auth Redirect Error checking Firestore:", err);
      } finally {
        setIsCheckingDb(false);
      }
    };

    checkUserProfile();

  }, [user, isUserLoading, firestore, router]);

  const isLoading = isUserLoading || isCheckingDb;

  // This hook no longer renders a loading spinner itself.
  // It relies on the page-level components (like AuthSetupPage) to handle their own loading states.
  // This prevents the flickering/blinking effect.
  return isLoading;
};

