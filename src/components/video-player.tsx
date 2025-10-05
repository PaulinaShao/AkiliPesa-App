'use client';

import { useState, useRef, useEffect } from 'react';
import type { Video, User } from '@/lib/definitions';
import { useInView } from '@/lib/hooks';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Phone, Video as VideoIcon, PlusCircle } from 'lucide-react';
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
import { Logo } from './logo';
import { cn } from '@/lib/utils';


interface VideoPlayerProps {
  video: Video;
  user: User;
  onPlay: (videoId: string, tags: string[]) => void;
}

export function VideoPlayer({ video, user, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  
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
  }, [isInView, onPlay, video.id, video.tags]);

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

  const shortenedCaption = video.caption.split(' ').slice(0, 3).join(' ');

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

      <div className="absolute bottom-16 md:bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
        <div className="flex items-end">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
               <div className="relative">
                 <Link href={`/profile/${user.username}`}>
                   <UserAvatar src={user.avatar} username={user.username} className="h-12 w-12 border-2 border-white" />
                 </Link>
                 <button className="absolute -bottom-1 -right-1 bg-white rounded-full">
                    <PlusCircle className="h-5 w-5 text-primary fill-background" />
                 </button>
               </div>
              <div>
                <Link href={`/profile/${user.username}`}>
                  <h3 className="font-bold text-lg">@{user.username}</h3>
                </Link>
              </div>
            </div>
            
            <p className="text-sm">
                {isCaptionExpanded ? video.caption : shortenedCaption}
                {video.caption.split(' ').length > 3 && (
                    <button onClick={() => setIsCaptionExpanded(!isCaptionExpanded)} className="font-semibold ml-1 hover:underline">
                        {isCaptionExpanded ? 'Less' : '... more'}
                    </button>
                )}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <Button variant="ghost" size="icon" className="text-white hover:text-white h-auto w-auto flex-col">
              <Phone className="h-8 w-8" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-white h-auto w-auto flex-col">
              <VideoIcon className="h-8 w-8" />
            </Button>
            <Button onClick={handleLike} variant="ghost" size="icon" className="text-white hover:text-white h-auto w-auto flex-col gap-1">
              <Heart className={cn("h-8 w-8", isLiked && "fill-red-500 text-red-500")} />
              <span className="text-xs font-bold">{likes.toLocaleString()}</span>
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-white h-auto w-auto flex-col gap-1">
                  <MessageCircle className="h-8 w-8" />
                  <span className="text-xs font-bold">{video.comments.toLocaleString()}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>{video.comments} Comments</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                  {allComments.filter(c => c.videoId === video.id).map(comment => {
                    const commentUser = user; // In a real app, you'd find the actual comment user
                     return (
                     <div key={comment.id} className="flex gap-2">
                       <UserAvatar src={commentUser.avatar} username={commentUser.username} className="h-8 w-8"/>
                       <div>
                         <p className="font-bold text-sm">@{commentUser.username}</p>
                         <p>{comment.text}</p>
                       </div>
                     </div>
                  )})}
                </div>
                <div className="mt-auto p-2 border-t">
                  <Input placeholder="Add a comment..."/>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="text-white hover:text-white h-auto w-auto flex-col gap-1">
              <Share2 className="h-8 w-8" />
              <span className="text-xs font-bold">{video.shares.toLocaleString()}</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-white h-auto w-auto" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
            </Button>
            <Logo className="h-12 w-12 text-white opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
}
