
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import { AgentProfilePanel } from '@/components/AgentProfilePanel';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import type { UserProfile } from 'docs/backend';

export default function PublicAgentProfilePage() {
  const firestore = useFirestore();
  const params = useParams();
  const handle = params.handle as string;

  const userQuery = useMemoFirebase(() => {
    if (!firestore || !handle) return null;
    return query(collection(firestore, 'users'), where('handle', '==', handle), limit(1));
  }, [firestore, handle]);

  const { data: users, isLoading: isProfileLoading } = useCollection<UserProfile>(userQuery);
  
  const profile = users?.[0];
  
  useEffect(() => {
    if (!isProfileLoading && (!users || users.length === 0)) {
      notFound();
    }
  }, [isProfileLoading, users]);

  if (isProfileLoading || !profile) {
    return (
      <div className="dark">
        <Header isMuted={true} onToggleMute={() => {}} />
        <div className="max-w-xl mx-auto p-4 pt-20">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 pb-24">
        <header className="flex flex-col items-center text-center">
          <FallbackAvatar src={profile.photoURL} alt={profile.handle} size={96} />
          <h1 className="text-2xl font-bold mt-4">@{profile.handle}</h1>
          <p className="text-muted-foreground">{profile.displayName}</p>
          <p className="text-sm max-w-md mt-2">{profile.bio}</p>
        </header>
        
        <AgentProfilePanel agentId={profile.uid} />
        
      </div>
    </div>
  );
}
