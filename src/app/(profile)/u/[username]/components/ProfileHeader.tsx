
'use client';

import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Edit, MessageCircle, Share2, UserCheck, UserPlus } from 'lucide-react';

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
    }
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onEditClick: () => void;
}

export function ProfileHeader({ user, isOwnProfile, isFollowing, onFollowToggle, onEditClick }: ProfileHeaderProps) {
  const formatStat = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num || 0;
  };

  return (
    <header className="flex flex-col items-center text-center">
      <Image src={user.avatar} alt={user.username} width={96} height={96} className="w-24 h-24 rounded-full border-4 border-background" data-ai-hint="person portrait"/>
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
        {isOwnProfile ? (
          <>
            <Button onClick={onEditClick} className="flex-1 bg-secondary text-secondary-foreground font-bold"><Edit size={16}/> Edit Profile</Button>
            <Button variant="secondary" className="flex-1 font-bold"><Share2 size={16}/> Share Profile</Button>
          </>
        ) : (
          <>
            <Button onClick={onFollowToggle} className="flex-1 bg-primary text-primary-foreground font-bold">
                {isFollowing ? <UserCheck size={16}/> : <UserPlus size={16}/>}
                {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button variant="secondary" className="flex-1 font-bold"><MessageCircle size={16}/> Message</Button>
          </>
        )}
      </div>
    </header>
  );
}
