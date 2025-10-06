'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { VideoFeed } from '@/components/video-feed';
import { videos, users } from '@/lib/data';

export default function Home() {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <>
      <Header transparent isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} />
      <div className="h-[100svh] w-full md:pb-0">
        <VideoFeed videos={videos} users={users} isMuted={isMuted} />
      </div>
    </>
  );
}
