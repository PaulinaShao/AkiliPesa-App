
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseUser, useFirestore } from "@/firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User as FirebaseUser } from "firebase/auth";

/**
 * -------------------------------------------------------------
 * AkiliPesa Auth Setup Page
 * -------------------------------------------------------------
 * Automatically creates Firestore profile + wallet for
 * new users redirected here after login.
 * Once saved, user is redirected to /u/[username]
 * -------------------------------------------------------------
 */

export default function AuthSetupPage() {
  const router = useRouter();
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 1️⃣ Detect Firebase user
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push("/auth/login");
    } else {
      setCurrentUser(user);
      setDisplayName(user.displayName || "");
      setHandle(user.email?.split("@")[0] || `user_${user.uid.substring(0, 6)}`);
    }
  }, [user, isUserLoading, router]);

  // 2️⃣ Handle setup form
  const handleSave = async () => {
    if (!currentUser || !firestore) return;
    setIsSaving(true);

    const userRef = doc(firestore, "users", currentUser.uid);
    const walletRef = doc(collection(firestore, "wallets"), currentUser.uid);

    try {
      const existing = await getDoc(userRef);
      if (existing.exists()) {
        router.push(`/u/${handle}`);
        return;
      }

      // 🧠 Create Firestore user profile
      const newProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: displayName || "New User",
        handle: handle.toLowerCase(),
        bio,
        photoURL:
          currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/200/200`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
      };

      // 💰 Create default wallet
      const newWallet = {
        balanceTZS: 20000,
        escrow: 0,
        plan: { id: "trial", credits: 10 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(userRef, newProfile),
        setDoc(walletRef, newWallet),
      ]);

      console.log("✅ Created profile + wallet for", currentUser.email);
      router.push(`/u/${handle}`);
    } catch (err) {
      console.error("🔥 Setup Error:", err);
      alert("Error creating your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3️⃣ UI
  if (isUserLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 dark bg-background">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#111]/90 backdrop-blur-xl border border-[#8B5CF6]/30 rounded-2xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gradient">
          Welcome to AkiliPesa
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Complete your profile to get started with AI, Wallet & Agents
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Display Name
            </label>
            <Input
              className="bg-[#1a1a1a] border-[#333]"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Username / Handle
            </label>
            <Input
              className="bg-[#1a1a1a] border-[#333]"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <Textarea
              rows={3}
              className="bg-[#1a1a1a] border-[#333]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-6 bg-[#8B5CF6] hover:bg-[#7C3AED]"
          >
            {isSaving ? "Creating your account..." : "Continue to AkiliPesa"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

