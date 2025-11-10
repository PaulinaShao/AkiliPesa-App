'use client';

import { useState, useRef, useEffect } from 'react';
import type { Post } from '@/lib/definitions';
import { useInView } from '@/lib/hooks';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Play, Pause, Phone, Video as VideoIcon, PlusCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { UserProfile } from 'docs/backend';
import { useInitiateCall } from '@/hooks/useInitiateCall';

interface VideoPlayerProps {
  post: Post;
  user: UserProfile;
  onPlay: (videoId: string, tags: string[]) => void;
  isMuted: boolean;
}

export function VideoPlayer({ post, user, onPlay, isMuted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { initiateCall } = useInitiateCall();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const isInView = useInView(videoRef, { threshold: 0.6 });

  useEffect(() => {
    if (isInView) {
      videoRef.current?.play();
      setIsPlaying(true);
      onPlay(post.id, post.tags);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isInView, onPlay, post.id, post.tags]);

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
  
  const [likes, setLikes] = useState(post.likes);
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
  
  const handleCall = (mode: 'audio' | 'video') => {
    initiateCall({
        mode,
        agentId: user.uid, // Calling the post author
        agentType: 'user'
    });
  };

  const shortenedCaption = post.caption.split(' ').slice(0, 3).join(' ');

  return (
    <div className="relative h-full w-full bg-black rounded-lg overflow-hidden snap-start">
      <video
        ref={videoRef}
        src={post.media.url}
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

      {/* Content Overlay */}
      <div 
        className="absolute left-[calc(env(safe-area-inset-left,0px)+12px)] right-[calc(env(safe-area-inset-right,0px)+80px)] z-20"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
        >
          <div className="flex items-start gap-3 mb-2">
            <div className="relative">
              <Link href={`/${user.handle}`}>
                <FallbackAvatar src={user.photoURL} alt={user.handle} size={48} className="h-12 w-12 border-2 border-white" />
              </Link>
              <button className="absolute -bottom-1 -right-1 bg-white rounded-full">
                <PlusCircle className="h-5 w-5 text-primary fill-background" />
              </button>
            </div>
            <div className="pt-2">
              <Link href={`/${user.handle}`}>
                <h3 className="font-bold text-lg text-white">@{user.handle}</h3>
              </Link>
            </div>
          </div>

          <div className='flex gap-2 mb-2'>
            <Button size="sm" className="bg-gradient-tanzanite bg-opacity-60 backdrop-blur-sm font-bold text-xs h-8 text-white border border-white/20">Buy TSh.5,000</Button>
            <Button size="sm" className="bg-gradient-tanzanite bg-opacity-60 backdrop-blur-sm font-bold text-xs h-8 text-white border border-white/20">Earn TSh.500</Button>
          </div>
          
          <p className="text-sm text-white">
            {isCaptionExpanded ? post.caption : shortenedCaption}
            {post.caption.split(' ').length > 3 && (
              <button onClick={() => setIsCaptionExpanded(!isCaptionExpanded)} className="font-semibold ml-1 hover:underline">
                {isCaptionExpanded ? 'Less' : '... more'}
              </button>
            )}
          </p>
      </div>

      {/* Right Column: Action Icons */}
      <div 
        className="absolute z-20 flex flex-col items-center justify-end space-y-6 text-white"
        style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 56px)',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px + 8px)',
            right: 'calc(env(safe-area-inset-right, 0px) + 8px)'
        }}
      >
          <button onClick={() => handleCall('audio')} className="flex flex-col items-center gap-1.5 focus:outline-none rounded-full">
            <Phone size={32} />
          </button>
        
          <button onClick={() => handleCall('video')} className="flex flex-col items-center gap-1.5 focus:outline-none rounded-full">
            <VideoIcon size={32} />
          </button>
       
        <button onClick={handleLike} className="flex flex-col items-center gap-1.5 focus:outline-none rounded-full">
          <Heart size={32} className={cn("transition-colors", isLiked && "fill-red-500 text-red-500")} />
          <span className="text-sm font-bold">{likes.toLocaleString()}</span>
        </button>
        <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1.5 focus:outline-none rounded-full">
                <MessageCircle size={32} />
                <span className="text-sm font-bold">{post.comments.toLocaleString()}</span>
              </button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>{post.comments} Comments</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                {/* Comments would be fetched here */}
              </div>
              <div className="mt-auto p-2 border-t">
                <Input placeholder="Add a comment..."/>
              </div>
            </SheetContent>
          </Sheet>
        <button className="flex flex-col items-center gap-1.5 focus:outline-none rounded-full">
          <Share2 size={32} />
          <span className="text-sm font-bold">{post.shares.toLocaleString()}</span>
        </button>
         <p className="font-bold text-gradient">AkiliPesa</p>
      </div>
    </div>
  );
}
