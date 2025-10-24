
'use client';

import { Button } from '@/components/ui/button';
import { Edit, Share2 } from 'lucide-react';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { useToast } from '@/hooks/use-toast';

interface ProfileHeaderProps {
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    bio: string;
    stats: {
      followers: number;
      following: number;
      likes: number;
      postsCount: number;
    };
  };
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export function ProfileHeader({ user, isOwnProfile, onEditClick }: ProfileHeaderProps) {
  const { toast } = useToast();
  
  const formatStat = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num || 0;
  };
  
  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile`; // Use canonical profile URL
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link Copied!",
        description: "Profile URL has been copied to your clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
      });
    }
  };

  return (
    <header className="flex flex-col items-center text-center">
      <FallbackAvatar src={user.avatar} alt={user.username} size={96} className="w-24 h-24 border-4 border-background" />
      <h1 className="text-2xl font-bold mt-4">@{user.username}</h1>
      <p className="text-muted-foreground">{user.name}</p>
      
      <div className="flex justify-center gap-6 my-4 w-full">
        <div className="text-center">
          <span className="font-bold text-lg">{formatStat(user.stats.following)}</span>
          <p className="text-muted-foreground text-sm">Following</p>
        </div>
        <div className="text-center">
          <span className="font-bold text-lg">{formatStat(user.stats.followers)}</span>
          <p className="text-muted-foreground text-sm">Followers</p>
        </div>
        <div className="text-center">
          <span className="font-bold text-lg">{formatStat(user.stats.likes)}</span>
          <p className="text-muted-foreground text-sm">Likes</p>
        </div>
      </div>

      <p className="text-sm max-w-md">{user.bio}</p>

      <div className="flex gap-2 my-4 w-full max-w-sm">
        {isOwnProfile && (
          <>
            <Button onClick={onEditClick} className="flex-1 bg-secondary text-secondary-foreground font-bold"><Edit size={16}/> Edit Profile</Button>
            <Button variant="secondary" className="flex-1 font-bold" onClick={handleShare}><Share2 size={16}/> Share Profile</Button>
          </>
        )}
      </div>
    </header>
  );
}
