import { Header } from '@/components/header';
import { VideoFeed } from '@/components/video-feed';
import { videos, users } from '@/lib/data';

export default function Home() {
  return (
    <>
      <Header transparent />
      <div className="h-screen w-full md:pb-0">
        <VideoFeed videos={videos} users={users} />
      </div>
    </>
  );
}
