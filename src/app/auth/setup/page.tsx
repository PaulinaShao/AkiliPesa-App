
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseUser, useFirestore } from "@/firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User as FirebaseUser } from "firebase/auth";
import { getPostLoginRedirect } from "@/lib/redirect";


export default function AuthSetupPage() {
  const router = useRouter();
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("Checking authentication...");

  const ensureUserDocuments = useCallback(async (firebaseUser: FirebaseUser) => {
    if (!firestore) {
      setStatus("Waiting for Firestore...");
      return;
    }

    setStatus("Verifying profile...");
    const userRef = doc(firestore, "users", firebaseUser.uid);
    
    try {
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setStatus("Profile found! Redirecting...");
        // Redirect using the user's UID for consistency
        const finalRedirect = getPostLoginRedirect(`/u/${firebaseUser.uid}`);
        router.replace(finalRedirect);
      } else {
        // User does not have a profile, stay on this page to create one
        setStatus("Welcome! Please complete your profile.");
        setDisplayName(firebaseUser.displayName || "");
        setHandle(firebaseUser.email?.split("@")[0] || `user_${firebaseUser.uid.substring(0, 6)}`);
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error checking user document:", error);
      setStatus("Error verifying profile. Please try again.");
    }
  }, [firestore, router]);


  useEffect(() => {
    if (isUserLoading) {
      setStatus("Checking authentication...");
      return;
    }
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    
    ensureUserDocuments(user);

  }, [user, isUserLoading, router, ensureUserDocuments]);


  const handleSaveAndInitialize = async () => {
    if (!user || !firestore || !handle) return;
    setIsSaving(true);
    setStatus("Creating your account...");

    const batch = writeBatch(firestore);

    // 1. User Profile
    const userRef = doc(firestore, "users", user.uid);
    batch.set(userRef, {
        uid: user.uid,
        handle: handle.toLowerCase(),
        displayName: displayName || "New User",
        email: user.email,
        phone: user.phoneNumber,
        photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
        bio: bio,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        wallet: { balance: 10, escrow: 0, plan: { id: 'trial', credits: 10, }, lastDeduction: null, lastTrialReset: serverTimestamp() },
        stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
    });

    // 2. Wallet Record
    const walletRef = doc(firestore, "wallets", user.uid);
    batch.set(walletRef, {
        agentId: user.uid, balanceTZS: 20000, earnedToday: 0, totalEarnings: 0, updatedAt: serverTimestamp()
    });

    // 3. Buyer Trust Score
    const trustRef = doc(firestore, "buyerTrust", user.uid);
    batch.set(trustRef, {
        buyerId: user.uid, trustScore: 70, level: 'Bronze', lastUpdated: serverTimestamp(), metrics: { onTimePayments: 0, latePayments: 0, refundsRequested: 0, positiveFeedback: 0, negativeFeedback: 0 }
    });

    // 4. Default AI Clone
    const cloneRef = doc(firestore, "users", user.uid, "clones", `clone_${user.uid.slice(0, 5)}`);
    batch.set(cloneRef, {
        cloneId: `clone_${user.uid.slice(0, 5)}`, userId: user.uid, name: `${displayName || 'New User'}'s AI Clone`, description: "Your personalized AI avatar for voice, face & chat.", avatarUrl: "/assets/default-avatar-tanzanite.svg", type: 'face', voiceModelUrl: "akilipesa_default_voice", status: "active", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });

    // 5. Default AI Agent
    const agentRef = doc(firestore, "users", user.uid, "agents", `agent_${user.uid.slice(0, 5)}`);
    batch.set(agentRef, {
        agentId: `agent_${user.uid.slice(0, 5)}`, uid: user.uid, name: `${displayName || 'New User'}'s Agent`, role: "Sales & Support Assistant", description: "Your AI-powered agent to assist customers and manage inquiries.", avatarUrl: "/assets/default-agent.png", specialty: ["sales", "support", "community"], tone: "helpful", status: "active", responseSpeed: "normal", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });

    try {
      await batch.commit();
      console.log("✅ All documents initialized for", user.email);
      const finalRedirect = getPostLoginRedirect(`/u/${user.uid}`);
      router.replace(finalRedirect);
    } catch (err) {
      console.error("🔥 Setup Error:", err);
      setStatus("Error creating profile. Please try again.");
      setIsSaving(false);
    }
  };

  const showLoading = isUserLoading || isSaving || status !== "Welcome! Please complete your profile.";

  if (showLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 dark bg-background">
        {status}
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
        <h1 className="text-2xl font-bold mb-2 text-center text-gradient">
          Welcome to AkiliPesa
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          {status}
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
            onClick={handleSaveAndInitialize}
            disabled={isSaving}
            className="w-full mt-6 bg-[#8B5CF6] hover:bg-[#7C3AED]"
          >
            {isSaving ? status : "Continue to AkiliPesa"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
