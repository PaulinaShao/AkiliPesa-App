
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

/**
 * AkiliPesa useAuthRedirect Hook
 * ----------------------------------------------------
 * Ensures smooth navigation between login, setup,
 * and profile views just like Instagram/TikTok.
 * - Shows a minimal loading spinner during checks.
 * - Redirects unauthenticated users to /auth/login
 * - Redirects new users to /auth/setup
 * - Keeps verified users on current or profile page
 * ----------------------------------------------------
 */

export const useAuthRedirect = () => {
  const router = useRouter();
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const [isCheckingDb, setIsCheckingDb] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for Firebase Auth to initialize
    }

    if (!user) {
      router.replace("/auth/login");
      setIsCheckingDb(false);
      return;
    }

    // Auth is loaded and we have a user, now check Firestore.
    const checkUserProfile = async () => {
      if (!firestore) {
          console.warn("Firestore not available yet in useAuthRedirect.");
          return;
      };
      try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // The ensureUserDoc function now handles creation.
        // This check is for routing to the setup page if the doc is still missing.
        if (!userSnap.exists()) {
          router.replace("/auth/setup");
        }
      } catch (err) {
        console.error("🔥 Auth Redirect Error checking Firestore:", err);
      } finally {
        setIsCheckingDb(false);
      }
    };

    checkUserProfile();

  }, [user, isUserLoading, firestore, router]);

  const isLoading = isUserLoading || isCheckingDb;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 z-[9999] text-white">
        <motion.div
          className="w-16 h-16 border-4 border-t-transparent border-[#8B5CF6] rounded-full animate-spin"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p className="mt-6 text-sm tracking-wide text-gray-400">
          Loading your AkiliPesa experience...
        </p>
      </div>
    );
  }

  return null; // hook-only component — no visual after auth check
};
