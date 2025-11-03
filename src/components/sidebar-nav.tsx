
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, User as UserIcon, Wallet, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const mainNavLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Discover' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/create/ai', icon: PlusSquare, label: 'Create' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/profile', icon: UserIcon, label: 'Profile' },
];

interface SidebarNavProps {
    user: User | null;
    isLoading: boolean;
}

export function SidebarNav({ user, isLoading }: SidebarNavProps) {
  const pathname = usePathname();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: currentUserProfile } = useDoc<any>(userDocRef);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background fixed h-full p-4 space-y-6">
      <Link href="/" className="flex items-center gap-2 px-2">
        <Logo className="h-8 w-8" />
        <h1 className="text-xl font-bold font-headline text-gradient">AkiliPesa</h1>
      </Link>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {mainNavLinks.map(({ href, icon: Icon, label }) => {
            let isActive = false;
            if (href === '/') {
              isActive = pathname === '/';
            } else if (href === '/profile') {
              isActive = pathname.startsWith('/profile');
            } else if (href === '/create/ai') {
              isActive = pathname.startsWith('/create');
            } else {
              isActive = pathname.startsWith(href);
            }

            return (
            <li key={label}>
              <Link href={href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-lg h-12 text-foreground"
                >
                  <Icon className="mr-3 h-6 w-6" />
                  {label}
                </Button>
              </Link>
            </li>
          )})}
        </ul>
      </nav>

      {user && currentUserProfile ? (
        <div className="mt-auto">
          <Link href="/profile">
            <Button variant="outline" className="w-full justify-start h-14">
              <FallbackAvatar src={currentUserProfile.photoURL} alt={currentUserProfile.handle} size={40} className="h-10 w-10 mr-3" />
              <div className='text-left'>
                  <p className='font-bold'>{currentUserProfile.displayName}</p>
                  <p className='text-muted-foreground text-sm'>@{currentUserProfile.handle}</p>
              </div>
            </Button>
          </Link>
        </div>
      ) : isLoading ? (
         <div className="mt-auto">
            <Button variant="outline" className="w-full justify-start h-14" disabled>
                <div className='text-left'>
                  <p className='text-muted-foreground text-sm'>Loading...</p>
              </div>
            </Button>
        </div>
      ) : null}
    </aside>
  );
}
