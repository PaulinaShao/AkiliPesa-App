'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, User, Users, Wallet, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { useFirebaseUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const mainNavLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Discover' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/create/ai', icon: PlusSquare, label: 'Create' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/u/placeholder', icon: User, label: 'Profile' }, // Placeholder href
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user: authUser } = useFirebaseUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
    [authUser, firestore]
  );
  const { data: currentUserProfile } = useDoc(userDocRef);

  const profileHref = currentUserProfile?.handle ? `/u/${currentUserProfile.handle}` : (authUser ? `/u/${authUser.uid}` : '/auth/login');

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background fixed h-full p-4 space-y-6">
      <Link href="/" className="flex items-center gap-2 px-2">
        <Logo className="h-8 w-8" />
        <h1 className="text-xl font-bold font-headline text-gradient">AkiliPesa</h1>
      </Link>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {mainNavLinks.map(({ href, icon: Icon, label }) => {
            const finalHref = label === 'Profile' ? profileHref : href;
            let isActive = false;
            if (href === '/') {
              isActive = pathname === '/';
            } else if (label === 'Profile') {
              isActive = pathname.startsWith('/u/');
            } else if (label === 'Create') {
              isActive = pathname.startsWith('/create');
            } else {
              isActive = pathname.startsWith(href);
            }

            return (
            <li key={label}>
              <Link href={finalHref}>
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

      {currentUserProfile ? (
        <div className="mt-auto">
          <Link href={profileHref}>
            <Button variant="outline" className="w-full justify-start h-14">
              <UserAvatar src={currentUserProfile.photoURL} username={currentUserProfile.handle} className="h-10 w-10 mr-3" />
              <div className='text-left'>
                  <p className='font-bold'>{currentUserProfile.displayName}</p>
                  <p className='text-muted-foreground text-sm'>@{currentUserProfile.handle}</p>
              </div>
            </Button>
          </Link>
        </div>
      ) : authUser ? (
         <div className="mt-auto">
            <Button variant="outline" className="w-full justify-start h-14">
                <div className='text-left'>
                  <p className='text-muted-foreground text-sm'>Loading profile...</p>
              </div>
            </Button>
        </div>
      ) : null}
    </aside>
  );
}
