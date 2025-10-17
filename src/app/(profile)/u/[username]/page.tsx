
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, query, collection, where, getDocs, limit } from 'firebase/firestore';

import { Header } from '@/components/header';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileQuickActions } from './components/ProfileQuickActions';
import { ProfileNav } from './components/ProfileNav';
import { AkiliPointsBadge } from './components/AkiliPointsBadge';
import { TrustScoreBadge } from './components/TrustScoreBadge';
import { BuyerTrustBadge } from './components/BuyerTrustBadge';
import { VideoCard } from '@/components/video-card';

// Example video data, to be replaced with Firestore query later
const userVideos: any[] = []; 

export default function ProfilePage() {
  const params = useParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!firestore) return;

      try {
        const username = params?.username;
        if (!username || typeof username !== 'string') {
            setLoading(false);
            return;
        };

        const usersRef = collection(firestore, "users");
        const q = query(usersRef, where("handle", "==", username), limit(1));
        const snap = await getDocs(q);

        if (!snap.empty) {
          setProfile({ ...snap.docs[0].data(), id: snap.docs[0].id });
        } else {
            // Fallback for cases where the URL might be a UID
            const user = auth?.currentUser;
            if (user && user.uid === username) {
                 const ref = doc(firestore, "users", user.uid);
                 const userSnap = await getDoc(ref);
                 if (userSnap.exists()) setProfile({ ...userSnap.data(), id: userSnap.id });
            }
        }
      } catch (e) {
        console.error("Profile fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }

    const unsub = auth?.onAuthStateChanged(() => {
      fetchProfile();
    });

    return () => {
      if (unsub) unsub();
    };

  }, [params, auth, firestore]);

  if (loading) {
    return (
        <div className="dark">
             <Header isMuted={true} onToggleMute={() => {}} />
             <div className="flex h-screen w-full items-center justify-center">
                <p>Loading profile...</p>
             </div>
        </div>
    );
  }
  
  if (!profile) {
    notFound();
  }

  return (
    <div className="dark overflow-x-hidden w-full max-w-full">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+80px)]">
        <ProfileHeader user={{
            id: profile.uid,
            username: profile.handle,
            name: profile.displayName,
            avatar: profile.photoURL,
            bio: profile.bio || '', // Provide default empty string
            stats: profile.stats || { followers: 0, following: 0, likes: 0, postsCount: 0 } // Provide default stats
        }} />
        <TrustScoreBadge sellerId={profile.uid} />
        <BuyerTrustBadge buyerId={profile.uid} />
        <AkiliPointsBadge userId={profile.uid} />
        <ProfileQuickActions />
        <ProfileNav />
        
        <div className="pb-16 md:pb-0">
            {userVideos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 mt-4">
                {userVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>This user hasn't posted any videos yet.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
