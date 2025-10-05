import Image from 'next/image';
import type { Video } from '@/lib/definitions';
import { Play } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-lg cursor-pointer">
      <Image
        src={video.thumbnailUrl}
        alt={video.caption}
        fill
        sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 15vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        data-ai-hint="dance music"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="h-12 w-12 text-white/80 fill-white/80" />
      </div>
      <div className="absolute bottom-0 left-0 p-2 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Play className="h-4 w-4" />
          <span>{video.likes.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
