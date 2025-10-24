
'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useFirebaseUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ProfileHeader } from './components/ProfileHeader';
import { Header } from '@/components/header';
import { ProfileQuickActions } from './components/ProfileQuickActions';
import { TrustScoreBadge } from './components/TrustScoreBadge';
import { BuyerTrustBadge } from './components/BuyerTrustBadge';
import { AkiliPointsBadge } from './components/AkiliPointsBadge';
import { ProfileEditorModal } from './components/ProfileEditorModal';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  // Redirects only once if unauthenticated
  const { user: currentUser, isUserLoading } = useRequireAuth('/profile');
  const firestore = useFirestore();
  const [showEditor, setShowEditor] = useState(false);

  // Build ref only when we have a user
  const userDocRef = useMemoFirebase(() => {
    if (!currentUser || !firestore) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [currentUser, firestore]);

  // Start Firestore read only when ref is ready
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  const handleSaveProfile = async (updates: any) => {
    if (!currentUser || !firestore) return;
    const userRef = doc(firestore, 'users', currentUser.uid);
    await updateDoc(userRef, { ...updates, updatedAt: new Date() });
    setShowEditor(false);
  };

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
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

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400 dark">
        User not found.
      </div>
    );
  }

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 pb-24">
        <ProfileHeader
          user={{
            id: profile.uid,
            username: profile.handle,
            name: profile.displayName,
            avatar: profile.photoURL,
            bio: profile.bio || '',
            stats: profile.stats || { followers: 0, following: 0, likes: 0, postsCount: 0 },
          }}
          isOwnProfile={true}
          onEditClick={() => setShowEditor(true)}
        />

        <TrustScoreBadge sellerId={profile.uid} />
        <BuyerTrustBadge buyerId={profile.uid} />
        <AkiliPointsBadge userId={profile.uid} />
        <ProfileQuickActions />
      </div>
      <ProfileEditorModal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
