'use client';

import { Volume2, VolumeX, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { users } from '@/lib/data';
import Link from 'next/link';
import { Logo } from './logo';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent }: HeaderProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b px-4 md:px-6",
      transparent ? "border-transparent" : "bg-background/80 backdrop-blur-sm"
    )}>
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold font-headline hidden md:block">AkiliPesa</h1>
      </Link>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-muted-foreground"/>
            <span className="font-semibold text-sm">TZS 20,000</span>
        </div>
        <Badge variant="secondary">Premium</Badge>
        <UserAvatar src={users[0].avatar} username={users[0].username} className="h-9 w-9" />
      </div>
    </header>
  );
}
