
'use client';

import { useParams, notFound } from 'next/navigation';
import { VideoCard } from '@/components/video-card';
import { Header } from '@/components/header';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileQuickActions } from './components/ProfileQuickActions';
import { ProfileNav } from './components/ProfileNav';
import { useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { videos as allVideos } from '@/lib/data'; // Keep for video data for now

export default function ProfilePage() {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';
  const firestore = useFirestore();
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();

  const userQuery = useMemoFirebase(() => {
    if (!firestore || !username) return null;
    return query(
      collection(firestore, 'users'),
      where('handle', '==', username),
      limit(1)
    );
  }, [firestore, username]);

  const { data: userData, isLoading: isProfileLoading } = useCollection(userQuery);
  const user = userData?.[0];
  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="dark">
        <Header isMuted={true} onToggleMute={() => {}} />
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user && !isLoading) {
    notFound();
  }

  // This part still uses mock data, can be updated later to fetch user-specific videos from Firestore
  const userVideos = allVideos.filter(v => v.userId === user.id);

  return (
    <div className="dark overflow-x-hidden w-full max-w-full">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+80px)]">
        <ProfileHeader user={{
            id: user.id,
            username: user.handle,
            name: user.displayName,
            avatar: user.photoURL,
            bio: user.bio || '',
            stats: user.stats || { followers: 0, following: 0, likes: 0, postsCount: 0 }
        }} />
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
