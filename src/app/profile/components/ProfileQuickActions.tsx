
'use client';
import { useState } from "react";
import { useFirebaseUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bot, UserSquare } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { CloneAgentModal } from './CloneAgentModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export function ProfileQuickActions() {
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const [activeModal, setActiveModal] = useState<null | "clone" | "agent">(null);


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
          <div className="my-6">
            <Card>
                <CardHeader>
                    <CardTitle>AI & Agents</CardTitle>
                    <CardDescription>Manage your digital clones and AI assistants.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                </CardContent>
            </Card>
          </div>
      )
  }

  return (
    <>
    <div className="my-6">
         <Card>
            <CardHeader>
                <CardTitle>AI & Agents</CardTitle>
                <CardDescription>Manage your digital clones and AI assistants.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-24">
                    <Link href="/profile/clones">
                        <UserSquare className="mr-2 h-6 w-6"/>
                        My Clones
                    </Link>
                </Button>
                 <Button asChild variant="outline" className="h-24">
                    <Link href="/profile/agents">
                        <Bot className="mr-2 h-6 w-6"/>
                        My Agents
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
    
      {/* Modals are kept in case you want to use them for quick edits from the main profile page later */}
      <CloneAgentModal
        isOpen={activeModal === "clone"}
        onClose={() => setActiveModal(null)}
        type="clone"
        data={clone}
        uid={user?.uid}
      />
      <CloneAgentModal
        isOpen={activeModal === "agent"}
        onClose={() => setActiveModal(null)}
        type="agent"
        data={agent}
        uid={user?.uid}
      />
    </>
  );
}
