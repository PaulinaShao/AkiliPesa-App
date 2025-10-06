'use client';

import { Wallet, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './logo';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface HeaderProps {
  transparent?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function Header({ transparent, isMuted, onToggleMute }: HeaderProps) {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b px-4 md:px-6",
      "supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]",
      transparent ? "border-transparent" : "bg-background/80 backdrop-blur-sm"
    )}>
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold font-headline hidden md:block">AkiliPesa</h1>
      </Link>
      
      <div className="flex flex-nowrap shrink items-center gap-2 md:gap-4 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
            <Wallet className="h-6 w-6 text-muted-foreground"/>
            <span className="font-semibold text-sm whitespace-nowrap truncate">TZS 20,000</span>
        </div>
        <Badge variant="secondary" className="shrink-0">Premium</Badge>
        <Button variant="ghost" size="icon" onClick={onToggleMute}>
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          <span className="sr-only">Toggle Sound</span>
        </Button>
      </div>
    </header>
  );
}
