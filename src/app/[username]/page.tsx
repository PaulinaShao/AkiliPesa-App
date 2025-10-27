'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirebaseUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ProfileHeader } from '@/app/profile/components/ProfileHeader';
import { Header } from '@/components/header';
import { ProfileQuickActions } from '@/app/profile/components/ProfileQuickActions';
import { TrustScoreBadge } from '@/app/profile/components/TrustScoreBadge';
import { BuyerTrustBadge } from '@/app/profile/components/BuyerTrustBadge';
import { AkiliPointsBadge } from '@/app/profile/components/AkiliPointsBadge';
import { ProfileEditorModal } from '@/app/profile/components/ProfileEditorModal';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const { user: currentUser } = useFirebaseUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (!username || !firestore) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      const usersRef = collection(firestore, "users");
      // Use 'handle' field for username lookup as defined in the backend.json
      const q = query(usersRef, where("handle", "==", username));
      
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setProfile(null);
        } else {
          // Assuming username (handle) is unique, take the first result.
          const profileDoc = querySnapshot.docs[0];
          setProfile({ id: profileDoc.id, ...profileDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username, firestore]);

  const handleSaveProfile = async (updates: any) => {
    if (!profile?.id || !firestore) return;
    const userRef = doc(firestore, 'users', profile.id);
    await updateDoc(userRef, { ...updates, updatedAt: new Date() });
    setProfile((prev: any) => ({ ...prev, ...updates }));
    setShowEditor(false);
  };
  
  const isOwnProfile = currentUser?.uid === profile?.id;

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
    return notFound();
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
          isOwnProfile={isOwnProfile}
          onEditClick={() => setShowEditor(true)}
        />
        
        {isOwnProfile && (
            <>
                <TrustScoreBadge sellerId={profile.id} />
                <BuyerTrustBadge buyerId={profile.id} />
                <AkiliPointsBadge userId={profile.id} />
                <ProfileQuickActions />
            </>
        )}
        
      </div>
      {isOwnProfile && (
        <ProfileEditorModal
            isOpen={showEditor}
            onClose={() => setShowEditor(false)}
            profile={profile}
            onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
