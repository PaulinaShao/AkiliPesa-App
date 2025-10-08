'use client';

import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/definitions';

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const formatStat = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  return (
    <header className="flex flex-col items-center text-center">
      <UserAvatar src={user.avatar} username={user.username} className="w-24 h-24 border-4 border-background" />
      <h1 className="text-2xl font-bold mt-4">@{user.username}</h1>
      
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

      <div className="flex gap-2 my-4">
        <Button className="flex-1 bg-secondary text-secondary-foreground font-bold">Edit Profile</Button>
        <Button className="flex-1 bg-secondary text-secondary-foreground font-bold">Share Profile</Button>
      </div>
    </header>
  );
}
