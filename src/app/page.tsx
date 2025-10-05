import { Header } from '@/components/header';
import { VideoFeed } from '@/components/video-feed';
import { videos, users } from '@/lib/data';

export default function Home() {
  return (
    <>
      <Header />
      <div className="h-screen w-full pt-16 pb-16 md:pb-0">
        <VideoFeed videos={videos} users={users} />
      </div>
    </>
  );
}
