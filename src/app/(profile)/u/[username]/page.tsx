
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, getDoc, query, collection, where, getDocs, limit, onSnapshot } from 'firebase/firestore';

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
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { username } = params as { username?: string };

  useEffect(() => {
    if (!username || !firestore) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // 🔍 Try match by handle first
            const usersRef = collection(firestore, "users");
            const handleQuery = query(usersRef, where("handle", "==", username), limit(1));
            const handleSnap = await getDocs(handleQuery);

            if (!handleSnap.empty) {
                const userDoc = handleSnap.docs[0];
                setProfile({ ...userDoc.data(), id: userDoc.id });
            } else {
                // 🔄 Fallback to UID lookup if handle not found
                const userRef = doc(firestore, "users", username);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setProfile({ ...userSnap.data(), id: userSnap.id });
                } else {
                    setProfile(null);
                }
            }
        } catch (err) {
            console.error("Profile fetch failed:", err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };
    
    // We need auth to be ready to have permission to query, but the query itself doesn't depend on who is logged in.
    const unsub = authUser !== undefined ? fetchProfile() : null;
    
    const authListener = onSnapshot(doc(firestore, `users/${authUser?.uid}`), (doc) => {
        // This listener is mainly to ensure the component re-evaluates if needed,
        // but the core logic is in fetchProfile.
    });


    return () => {
      // Cleanup, although fetchProfile is async and might complete after unmount.
      // A more robust solution might use an AbortController.
      if(authListener) authListener();
    };

  }, [username, authUser, firestore]);

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
    return (
        <div className="dark">
             <Header isMuted={true} onToggleMute={() => {}} />
             <div className="flex h-screen w-full items-center justify-center">
                <p>User not found.</p>
             </div>
        </div>
    );
  }

  return (
    <div className="dark overflow-x-hidden w-full max-w-full">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+80px)]">
        <ProfileHeader user={{
            id: profile.id,
            username: profile.handle,
            name: profile.displayName,
            avatar: profile.photoURL,
            bio: profile.bio || '', // Provide default empty string
            stats: profile.stats || { followers: 0, following: 0, likes: 0, postsCount: 0 } // Provide default stats
        }} />
        <TrustScoreBadge sellerId={profile.id} />
        <BuyerTrustBadge buyerId={profile.id} />
        <AkiliPointsBadge userId={profile.id} />
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
