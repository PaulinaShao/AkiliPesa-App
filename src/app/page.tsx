'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { VideoFeed } from '@/components/video-feed';
import { getPostsAndUsers } from '@/lib/data';
import type { Post } from '@/lib/definitions';
import type { UserProfile } from 'docs/backend';

export default function Home() {
  const [isMuted, setIsMuted] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPostsAndUsers().then(({ posts, users }) => {
      setPosts(posts);
      setUsers(users);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p>Loading Feed...</p>
        </div>
    )
  }

  return (
    <>
      <Header transparent isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} />
      <div className="h-[100svh] w-full md:pb-0">
        <VideoFeed posts={posts} users={users} isMuted={isMuted} />
      </div>
    </>
  );
}
