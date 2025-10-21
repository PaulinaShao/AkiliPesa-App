
'use client';

import { useEffect, useState } from "react";
import { useFirebaseUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bot, UserSquare, UserPlus } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";


export function ProfileQuickActions() {
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();

  const cloneDocRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, "users", user.uid, "clones", `clone_${user.uid.slice(0, 5)}`);
  }, [user, firestore]);

  const agentDocRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, "users", user.uid, "agents", `agent_${user.uid.slice(0, 5)}`);
  }, [user, firestore]);

  const { data: clone, isLoading: isCloneLoading } = useDoc(cloneDocRef);
  const { data: agent, isLoading: isAgentLoading } = useDoc(agentDocRef);

  const isLoading = isUserLoading || isCloneLoading || isAgentLoading;

  if (isLoading) {
      return (
          <div className="grid grid-cols-2 gap-4 my-6">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
          </div>
      )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-2 gap-4 my-6"
    >
      {/* My Clone */}
      {clone ? (
        <Link href="/u/me/clones">
        <div className="bg-[#0e0e10]/80 border border-[#8B5CF6]/40 p-4 rounded-2xl text-center shadow-lg backdrop-blur-md h-full hover:border-[#8B5CF6]/70 transition-colors">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <Image
              src={clone.avatarUrl || "/assets/default-avatar.png"}
              alt="AI Clone"
              fill
              className="rounded-full object-cover border border-[#8B5CF6]/30"
            />
          </div>
          <h3 className="text-white font-semibold text-sm truncate">{clone.name}</h3>
          <p className="text-[#8B5CF6] text-xs mt-1 capitalize">Status: {clone.status}</p>
        </div>
        </Link>
      ) : (
        <Button
          size="lg"
          className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white h-full rounded-2xl flex flex-col items-center justify-center hover:opacity-90"
          asChild
        >
          <Link href="/u/me/clones">
            <UserSquare className="h-6 w-6 mb-2" />
            My Clone
          </Link>
        </Button>
      )}

      {/* My Agent */}
      {agent ? (
        <Link href="/u/me/agents">
        <div className="bg-[#0e0e10]/80 border border-[#8B5CF6]/40 p-4 rounded-2xl text-center shadow-lg backdrop-blur-md h-full hover:border-[#8B5CF6]/70 transition-colors">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <Image
              src={agent.avatarUrl || "/assets/default-agent.png"}
              alt="AI Agent"
              fill
              className="rounded-full object-cover border border-[#8B5CF6]/30"
            />
          </div>
          <h3 className="text-white font-semibold text-sm truncate">{agent.name}</h3>
          <p className="text-[#8B5CF6] text-xs mt-1 capitalize">Status: {agent.status}</p>
        </div>
        </Link>
      ) : (
        <Button
          size="lg"
          className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white h-full rounded-2xl flex flex-col items-center justify-center hover:opacity-90"
          asChild
        >
          <Link href="/u/me/agents">
            <Bot className="h-6 w-6 mb-2" />
            My Agent
          </Link>
        </Button>
      )}
    </motion.div>
  );
}
