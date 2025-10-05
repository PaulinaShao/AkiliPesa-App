'use client';

import { useState, useRef, useEffect } from 'react';
import type { Video, User } from '@/lib/definitions';
import { useInView } from '@/lib/hooks';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { comments as allComments } from '@/lib/data';
import { Input } from './ui/input';


interface VideoPlayerProps {
  video: Video;
  user: User;
  onPlay: (videoId: string, tags: string[]) => void;
}

export function VideoPlayer({ video, user, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const isInView = useInView(videoRef, { threshold: 0.6 });

  useEffect(() => {
    if (isInView) {
      videoRef.current?.play();
      setIsPlaying(true);
      onPlay(video.id, video.tags);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isInView]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };
  
  const [likes, setLikes] = useState(video.likes);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikes(l => l - 1);
      setIsLiked(false);
    } else {
      setLikes(l => l + 1);
      setIsLiked(true);
    }
  }

  return (
    <div className="relative h-full w-full bg-black rounded-lg overflow-hidden snap-start">
      <video
        ref={videoRef}
        src={video.videoUrl}
        loop
        muted={isMuted}
        playsInline
        className="h-full w-full object-cover"
        onClick={togglePlay}
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 grid place-items-center bg-black/40" onClick={togglePlay}>
          <Play className="h-20 w-20 text-white/70" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
        <div className="flex items-end">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${user.username}`}>
                <UserAvatar src={user.avatar} username={user.username} className="h-12 w-12 border-2 border-white" />
              </Link>
              <div>
                <Link href={`/profile/${user.username}`}>
                  <h3 className="font-bold text-lg">@{user.username}</h3>
                </Link>
                <p className="text-sm">{user.name}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-4 bg-transparent text-white border-white">Follow</Button>
            </div>
            <p className="text-sm">{video.caption}</p>
            <div className="flex gap-2">
                {video.tags.map(tag => <span key={tag} className="font-semibold">#{tag}</span>)}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Button onClick={handleLike} variant="ghost" size="icon" className="text-white hover:text-white h-14 w-14">
              <Heart className={isLiked ? "h-9 w-9 fill-red-500 text-red-500" : "h-9 w-9"} />
              <span className="text-sm font-bold">{likes.toLocaleString()}</span>
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-white h-14 w-14">
                  <MessageCircle className="h-9 w-9" />
                  <span className="text-sm font-bold">{video.comments.toLocaleString()}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>{video.comments} Comments</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                  {allComments.filter(c => c.videoId === video.id).map(comment => (
                     <div key={comment.id} className="flex gap-2">
                       <UserAvatar src={user.avatar} username={user.username} className="h-8 w-8"/>
                       <div>
                         <p className="font-bold text-sm">@{comment.userId}</p>
                         <p>{comment.text}</p>
                       </div>
                     </div>
                  ))}
                </div>
                <div className="mt-auto p-2 border-t">
                  <Input placeholder="Add a comment..."/>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="text-white hover:text-white h-14 w-14">
              <Share2 className="h-9 w-9" />
              <span className="text-sm font-bold">{video.shares.toLocaleString()}</span>
            </Button>
          </div>
        </div>
      </div>
      
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white bg-black/30" onClick={toggleMute}>
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </Button>
    </div>
  );
}
