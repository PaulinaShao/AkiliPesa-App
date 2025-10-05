'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Video, User } from '@/lib/definitions';
import { VideoPlayer } from '@/components/video-player';
import { getSuggestedTopics } from '@/app/actions';
import { SuggestedTopics } from '@/components/suggested-topics';

interface VideoFeedProps {
  videos: Video[];
  users: User[];
}

export function VideoFeed({ videos, users }: VideoFeedProps) {
  const [watchedTopics, setWatchedTopics] = useState<Set<string>>(new Set());
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handlePlay = useCallback(async (videoId: string, tags: string[]) => {
    const newTopics = new Set(watchedTopics);
    let changed = false;
    tags.forEach(tag => {
      if (!newTopics.has(tag)) {
        newTopics.add(tag);
        changed = true;
      }
    });

    if (changed) {
      setWatchedTopics(newTopics);
      if (newTopics.size > 2) {
        const topicsString = Array.from(newTopics).join(', ');
        const suggestions = await getSuggestedTopics(topicsString);
        setSuggestedTopics(suggestions);
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
      }
    }
  }, [watchedTopics]);

  const getUserForVideo = (userId: string) => {
    return users.find(u => u.id === userId)!;
  };

  const handleClearSuggestions = () => {
    setShowSuggestions(false);
  }

  const memoizedVideos = useMemo(() => videos.map(video => (
    <div key={video.id} className="h-full w-full flex-shrink-0">
      <VideoPlayer
        video={video}
        user={getUserForVideo(video.userId)}
        onPlay={handlePlay}
      />
    </div>
  )), [videos, users, handlePlay]);

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full max-w-lg mx-auto snap-y snap-mandatory overflow-y-scroll hide-scrollbar scroll-smooth">
        {memoizedVideos}
      </div>
      {showSuggestions && suggestedTopics.length > 0 && (
          <div className="absolute top-20 md:top-2 left-1/2 -translate-x-1/2 w-full max-w-md px-2 z-30">
             <SuggestedTopics topics={suggestedTopics} onClear={handleClearSuggestions} />
          </div>
      )}
    </div>
  );
}
