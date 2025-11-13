
'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useFirebaseUser, useFirestore, useDoc, useFsMemo } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ProfileHeader } from '@/app/profile/components/ProfileHeader';
import { Header } from '@/components/header';
import { ProfileQuickActions } from '@/app/profile/components/ProfileQuickActions';
import { TrustScoreBadge } from '@/app/profile/components/TrustScoreBadge';
import { BuyerTrustBadge } from '@/app/profile/components/BuyerTrustBadge';
import { AkiliPointsBadge } from '@/app/profile/components/AkiliPointsBadge';
import { ProfileEditorModal } from '@/app/profile/components/ProfileEditorModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from 'docs/backend';


export default function UserProfileContent() {
  const { user: currentUser, isUserLoading: isAuthLoading } = useFirebaseUser();
  const { firestore, functions } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [showEditor, setShowEditor] = useState(false);
  
  const userDocRef = useFsMemo(() => {
    if (!currentUser || !firestore) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [currentUser?.uid, firestore]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const handleSaveProfile = async (updates: any) => {
    if (!currentUser || !firestore) return;
    const userRef = doc(firestore, 'users', currentUser.uid);
    await updateDoc(userRef, { ...updates, updatedAt: new Date() });
    setShowEditor(false);
  };
  
  const handleSeedDemo = async () => {
    if (!functions) return;
    const seedDemoCallable = httpsCallable(functions, 'seeddemo');
    try {
      toast({ title: 'Seeding...', description: 'Adding a sample video to your feed.' });
      const result = await seedDemoCallable();
      toast({ title: 'Success!', description: (result.data as any).message });
      // Optional: force a refresh or use a state management to update the feed
      router.refresh();
    } catch (error) {
      console.error("Error seeding demo data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add sample video.' });
    }
  };
  
  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading || !profile || !currentUser) {
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
            id: currentUser.uid,
            username: profile.handle,
            name: profile.displayName,
            avatar: profile.photoURL,
            bio: profile.bio || '',
            stats: profile.stats || { followers: 0, following: 0, likes: 0, postsCount: 0 },
          }}
          isOwnProfile={true}
          onEditClick={() => setShowEditor(true)}
        />
        
        <TrustScoreBadge sellerId={currentUser.uid} />
        <BuyerTrustBadge buyerId={currentUser.uid} />
        <AkiliPointsBadge userId={currentUser.uid} />
        <ProfileQuickActions />
        
        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={handleSeedDemo}>
            Seed Demo Video
          </Button>
        </div>
        
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
