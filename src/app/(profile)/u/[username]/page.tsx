'use client';

import { users, videos as allVideos } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Heart, Settings, Briefcase, ShoppingBag, Grid3x3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from '@/components/video-card';
import { Header } from '@/components/header';
import { ProfileHeader } from './components/ProfileHeader';

export default function ProfilePage() {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';
  const user = users.find(u => u.username === username);

  if (!user) {
    notFound();
  }

  const userVideos = allVideos.filter(v => v.userId === user.id);
  const likedVideos = allVideos.slice(0, 4); // Placeholder for liked videos

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20">
        <ProfileHeader user={user} />

        <Tabs defaultValue="posts" className="mt-4">
          <TabsList className="grid w-full grid-cols-5 bg-transparent border-b rounded-none">
            <TabsTrigger value="posts" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"><Grid3x3 /></TabsTrigger>
            <TabsTrigger value="agents" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"><Briefcase /></TabsTrigger>
            <TabsTrigger value="shop" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"><ShoppingBag /></TabsTrigger>
            <TabsTrigger value="liked" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"><Heart /></TabsTrigger>
            <TabsTrigger value="settings" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"><Settings /></TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts">
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
          </TabsContent>
          <TabsContent value="agents">
             <div className="text-center py-16 text-muted-foreground">
                <p>Your AI agents will appear here. This section is under construction.</p>
              </div>
          </TabsContent>
           <TabsContent value="shop">
             <div className="text-center py-16 text-muted-foreground">
                <p>Your shop will appear here. This section is under construction.</p>
              </div>
          </TabsContent>
          <TabsContent value="liked">
            <div className="grid grid-cols-3 gap-1 mt-4">
                {likedVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
          </TabsContent>
           <TabsContent value="settings">
             <div className="text-center py-16 text-muted-foreground">
                <p>Your settings will appear here. This section is under construction.</p>
              </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
