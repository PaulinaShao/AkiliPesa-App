
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileQuickActions } from './components/ProfileQuickActions';
import { ProfileNav } from './components/ProfileNav';
import { AkiliPointsBadge } from './components/AkiliPointsBadge';
import { TrustScoreBadge } from './components/TrustScoreBadge';
import { BuyerTrustBadge } from './components/BuyerTrustBadge';
import { VideoCard } from '@/components/video-card';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';

// This is now a Server Component

async function getProfileByHandle(handle: string) {
  // We need a way to talk to Firestore on the server.
  // The client-side `initializeFirebase` gives us what we need,
  // but in a real server environment, you'd use the Admin SDK.
  // For this context, we can re-use the client initialization logic.
  const { firestore } = initializeFirebase();
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('handle', '==', handle), limit(1));
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const userDoc = querySnapshot.docs[0];
  return { ...userDoc.data(), id: userDoc.id };
}


// Example video data, to be replaced with Firestore query later
const userVideos: any[] = []; 

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const username = params.username;
  const user = await getProfileByHandle(username);

  // If no user is found, render the 404 page.
  if (!user) {
    notFound();
  }

  return (
    <div className="dark overflow-x-hidden w-full max-w-full">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+80px)]">
        <ProfileHeader user={{
            id: user.uid,
            username: user.handle,
            name: user.displayName,
            avatar: user.photoURL,
            bio: user.bio || '', // Provide default empty string
            stats: user.stats || { followers: 0, following: 0, likes: 0, postsCount: 0 } // Provide default stats
        }} />
        <TrustScoreBadge sellerId={user.uid} />
        <BuyerTrustBadge buyerId={user.uid} />
        <AkiliPointsBadge userId={user.uid} />
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
