'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, User, Users, Wallet, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { UserAvatar } from '@/components/user-avatar';
import { users } from '@/lib/data';
import { Button } from '@/components/ui/button';

const mainNavLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Discover' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/create/ai', icon: PlusSquare, label: 'Create' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/u/financeWizard', icon: User, label: 'Profile' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const currentUser = users.find(u => u.username === 'financeWizard');


  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background fixed h-full p-4 space-y-6">
      <Link href="/" className="flex items-center gap-2 px-2">
        <Logo className="h-8 w-8" />
        <h1 className="text-xl font-bold font-headline text-gradient">AkiliPesa</h1>
      </Link>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {mainNavLinks.map(({ href, icon: Icon, label }) => {
            const finalHref = label === 'Profile' ? `/u/financeWizard` : href;
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
            <li key={href}>
              <Link href={finalHref}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-lg h-12"
                >
                  <Icon className="mr-3 h-6 w-6" />
                  {label}
                </Button>
              </Link>
            </li>
          )})}
        </ul>
      </nav>

      <div className="space-y-4">
        <h2 className="px-2 text-sm font-semibold text-muted-foreground tracking-wider uppercase">Following</h2>
        <ul className="space-y-2">
            {users.slice(1, 5).map(user => (
                <li key={user.id}>
                     <Link href={`/u/${user.username}`}>
                        <Button variant="ghost" className="w-full justify-start h-11">
                            <UserAvatar src={user.avatar} username={user.username} className="h-8 w-8 mr-3" />
                            <span className='truncate'>{user.name}</span>
                        </Button>
                    </Link>
                </li>
            ))}
        </ul>
      </div>

      {currentUser && (
        <div className="mt-auto">
          <Link href={`/u/${currentUser.username}`}>
            <Button variant="outline" className="w-full justify-start h-14">
              <UserAvatar src={currentUser.avatar} username={currentUser.username} className="h-10 w-10 mr-3" />
              <div className='text-left'>
                  <p className='font-bold'>{currentUser.name}</p>
                  <p className='text-muted-foreground text-sm'>@{currentUser.username}</p>
              </div>
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}
