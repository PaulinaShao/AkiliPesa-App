
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { ProfileHeader } from '@/app/profile/components/ProfileHeader';
import { Header } from '@/components/header';
import { TrustScoreBadge } from '@/app/profile/components/TrustScoreBadge';
import { BuyerTrustBadge } from '@/app/profile/components/BuyerTrustBadge';
import { AkiliPointsBadge } from '@/app/profile/components/AkiliPointsBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import { AvatarWithPresence } from '@/components/AvatarWithPresence';

export default function PublicProfilePage() {
  const firestore = useFirestore();
  const params = useParams();
  const username = params.username as string;

  const userQuery = useMemoFirebase(() => {
    if (!firestore || !username) return null;
    return query(collection(firestore, 'users'), where('handle', '==', username), limit(1));
  }, [firestore, username]);

  const { data: users, isLoading: isProfileLoading } = useCollection<any>(userQuery);
  const profile = users?.[0];
  const profileId = profile?.id;

  useEffect(() => {
    // This effect should only run when the loading state changes from true to false.
    // If loading is finished and there are still no users, then it's a 404.
    if (!isProfileLoading && (!users || users.length === 0)) {
      notFound();
    }
  }, [isProfileLoading, users]);
  
  const isLoading = isProfileLoading;

  if (isLoading || !profile) {
    return (
      <div className="dark">
        <Header isMuted={true} onToggleMute={() => {}} />
        <div className="max-w-xl mx-auto p-4 pt-20">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-32 mt-2" />
            <div className="flex justify-center gap-6 my-4 w-full">
              <div className="text-center"><Skeleton className="h-7 w-12" /><Skeleton className="h-4 w-16 mt-1" /></div>
              <div className="text-center"><Skeleton className="h-7 w-12" /><Skeleton className="h-4 w-16 mt-1" /></div>
              <div className="text-center"><Skeleton className="h-7 w-12" /><Skeleton className="h-4 w-14 mt-1" /></div>
            </div>
            <Skeleton className="h-10 w-full max-w-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 pb-24">
        <ProfileHeader
          user={{
            id: profile.id,
            username: profile.handle,
            name: profile.displayName,
            avatar: profile.photoURL,
            bio: profile.bio || '',
            stats: profile.stats || { followers: 0, following: 0, likes: 0, postsCount: 0 },
          }}
          isOwnProfile={false} // Public profiles are not editable by default
          onEditClick={() => {}}
        />
        
        {profileId && (
          <>
            <TrustScoreBadge sellerId={profileId} />
            <BuyerTrustBadge buyerId={profileId} />
            <AkiliPointsBadge userId={profileId} />
          </>
        )}
      </div>
    </div>
  );
}

