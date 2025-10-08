
import { users, videos as allVideos } from '@/lib/data';
import { notFound } from 'next/navigation';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Grid3x3, Heart, Settings, ShoppingBag, Briefcase, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from '@/components/video-card';
import { Header } from '@/components/header';
import Link from 'next/link';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const user = users.find(u => u.username === params.username);

  if (!user) {
    notFound();
  }

  const userVideos = allVideos.filter(v => v.userId === user.id);
  const likedVideos = allVideos.slice(0, 4); // Placeholder for liked videos

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20">
        <header className="flex flex-col items-center text-center">
          <UserAvatar src={user.avatar} username={user.username} className="w-24 h-24 border-4 border-background" />
          <h1 className="text-2xl font-bold mt-4">@{user.username}</h1>
          
          <div className="flex justify-center gap-6 my-4 w-full">
            <div className="text-center">
              <span className="font-bold text-lg">{user.following}</span>
              <p className="text-muted-foreground text-sm">Following</p>
            </div>
            <div className="text-center">
              <span className="font-bold text-lg">{(user.followers / 1000000).toFixed(1)}M</span>
              <p className="text-muted-foreground text-sm">Followers</p>
            </div>
            <div className="text-center">
               <span className="font-bold text-lg">{(user.likes / 1000000).toFixed(1)}M</span>
              <p className="text-muted-foreground text-sm">Likes</p>
            </div>
          </div>

          <p className="text-sm max-w-md">{user.bio}</p>

          <div className="flex gap-2 my-4">
            <Button className="flex-1 bg-secondary text-secondary-foreground font-bold">Edit Profile</Button>
            <Button className="flex-1 bg-secondary text-secondary-foreground font-bold">Share Profile</Button>
          </div>
        </header>

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
