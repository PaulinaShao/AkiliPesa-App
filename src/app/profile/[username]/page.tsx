import { users, videos as allVideos } from '@/lib/data';
import { notFound } from 'next/navigation';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Share2, MoreHorizontal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from '@/components/video-card';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const user = users.find(u => u.username === params.username);

  if (!user) {
    notFound();
  }

  const userVideos = allVideos.filter(v => v.userId === user.id);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <UserAvatar src={user.avatar} username={user.username} className="w-32 h-32 md:w-40 md:h-40 border-4 border-muted" />
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <div className="flex gap-2">
              <Button>Follow</Button>
              <Button variant="outline">Message</Button>
              <Button variant="ghost" size="icon"><Share2 className="h-5 w-5"/></Button>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5"/></Button>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-4">{user.name}</h2>
          
          <div className="flex justify-center md:justify-start gap-6 mb-4">
            <div className="text-center">
              <span className="font-bold text-lg">{user.following}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-lg">{user.followers.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-lg">{allVideos.filter(v => v.userId === user.id).reduce((acc, v) => acc + v.likes, 0).toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">Likes</span>
            </div>
          </div>

          <p className="text-muted-foreground">{user.bio}</p>
        </div>
      </header>

      <Tabs defaultValue="videos" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto md:mx-0">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="liked">Liked</TabsTrigger>
        </TabsList>
        <TabsContent value="videos">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 mt-4">
            {userVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="liked">
          <div className="text-center py-16 text-muted-foreground">
            <p>This user's liked videos are private.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
