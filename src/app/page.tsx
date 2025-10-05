import { VideoFeed } from '@/components/video-feed';
import { videos, users } from '@/lib/data';

export default function Home() {
  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen w-full pb-16 md:pb-0">
      <VideoFeed videos={videos} users={users} />
    </div>
  );
}
