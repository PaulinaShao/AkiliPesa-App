'use client';

import { users, videos as allVideos } from '@/lib/data';
import { useParams, notFound } from 'next/navigation';
import { VideoCard } from '@/components/video-card';
import { Header } from '@/components/header';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileQuickActions } from './components/ProfileQuickActions';
import { ProfileNav } from './components/ProfileNav';

export default function ProfilePage() {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';
  const user = users.find(u => u.username === username);

  if (!user) {
    notFound();
  }

  const userVideos = allVideos.filter(v => v.userId === user.id);

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20">
        <ProfileHeader user={user} />
        <ProfileQuickActions />
        <ProfileNav />
        
        <div>
            {userVideos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 mt-4">
                {userVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Your posted reels will appear here. This section is under construction.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
