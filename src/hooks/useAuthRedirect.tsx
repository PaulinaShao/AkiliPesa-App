"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useFirebaseUser } from "@/firebase";
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

    const checkUserProfile = async () => {
      if (!firestore) return;
      try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // This assumes you have or will create an /auth/setup page
          router.replace("/auth/setup");
        }
      } catch (err) {
        console.error("🔥 Auth Redirect Error:", err);
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
