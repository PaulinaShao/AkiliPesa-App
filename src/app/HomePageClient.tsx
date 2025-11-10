
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { VideoFeed } from '@/components/video-feed';
import type { Post } from '@/lib/definitions';
import type { UserProfile } from 'docs/backend';

interface HomePageClientProps {
  initialPosts: Post[];
  initialUsers: UserProfile[];
}

export default function HomePageClient({ initialPosts, initialUsers }: HomePageClientProps) {
  const [isMuted, setIsMuted] = useState(true);
  
  // The data is now passed directly as props, no need for loading state here.
  const [posts, setPosts] = useState(initialPosts);
  const [users, setUsers] = useState(initialUsers);

  // If you had loading state before, it's no longer necessary
  // as the server component handles the data fetching wait time.

  return (
    <>
      <Header transparent isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} />
      <div className="h-[100svh] w-full md:pb-0">
        <VideoFeed posts={posts} users={users} isMuted={isMuted} />
      </div>
    </>
  );
}
