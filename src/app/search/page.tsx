'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { users as allUsers, videos as allVideos } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';

  const filteredUsers = query ? allUsers.filter(
    u => u.username.toLowerCase().includes(query) || u.name.toLowerCase().includes(query)
  ) : allUsers;

  const filteredVideos = query ? allVideos.filter(
    v => v.caption.toLowerCase().includes(query) || v.tags.some(t => t.includes(query))
  ) : allVideos;

  if (!query) {
    return <div className="text-center py-16 text-muted-foreground">Start by typing in the search bar above.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
       <h1 className="text-2xl font-bold mb-4">Results for "{query}"</h1>
       <Tabs defaultValue="top" className="w-full">
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>
        <TabsContent value="top" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Accounts</h2>
            <div className="space-y-4 mb-8">
              {filteredUsers.slice(0, 3).map(user => (
                <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                    <UserAvatar src={user.avatar} username={user.username} className="w-16 h-16"/>
                    <div>
                      <p className="font-bold text-lg">{user.username}</p>
                      <p className="text-muted-foreground">{user.name} · {user.followers.toLocaleString()} followers</p>
                      <p className="text-sm mt-1 line-clamp-1">{user.bio}</p>
                    </div>
                    <Button className="ml-auto">Follow</Button>
                </Link>
              ))}
            </div>
            
            <h2 className="text-xl font-semibold mb-4">Videos</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredVideos.slice(0, 6).map(video => {
                  const user = allUsers.find(u => u.id === video.userId);
                  return (
                    <Link key={video.id} href="#" className="border rounded-lg overflow-hidden group">
                      <div className="relative aspect-video">
                        <Image src={video.thumbnailUrl} alt={video.caption} fill className="object-cover" data-ai-hint="people lifestyle" />
                      </div>
                      <div className="p-3">
                         <p className="font-semibold truncate">{video.caption}</p>
                         <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                            <UserAvatar src={user?.avatar} username={user?.username} className="w-6 h-6"/>
                            <span>{user?.username}</span>
                            <span className="flex items-center gap-1 ml-auto"><Heart className="w-4 h-4"/> {video.likes.toLocaleString()}</span>
                         </div>
                      </div>
                    </Link>
                  )
              })}
            </div>
        </TabsContent>
        <TabsContent value="accounts" className="mt-6">
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                  <UserAvatar src={user.avatar} username={user.username} className="w-16 h-16"/>
                  <div>
                    <p className="font-bold text-lg">{user.username}</p>
                    <p className="text-muted-foreground">{user.name} · {user.followers.toLocaleString()} followers</p>
                    <p className="text-sm mt-1 line-clamp-1">{user.bio}</p>
                  </div>
                  <Button className="ml-auto">Follow</Button>
              </Link>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="videos" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredVideos.map(video => {
                  const user = allUsers.find(u => u.id === video.userId);
                  return (
                    <Link key={video.id} href="#" className="border rounded-lg overflow-hidden group">
                      <div className="relative aspect-video">
                        <Image src={video.thumbnailUrl} alt={video.caption} fill className="object-cover" data-ai-hint="lifestyle activity"/>
                      </div>
                      <div className="p-3">
                         <p className="font-semibold truncate">{video.caption}</p>
                         <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                            <UserAvatar src={user?.avatar} username={user?.username} className="w-6 h-6"/>
                            <span>{user?.username}</span>
                            <span className="flex items-center gap-1 ml-auto"><Heart className="w-4 h-4"/> {video.likes.toLocaleString()}</span>
                         </div>
                      </div>
                    </Link>
                  )
              })}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
