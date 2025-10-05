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
  { href: '/upload', icon: PlusSquare, label: 'Create' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/profile/naturelover', icon: User, label: 'Profile' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background fixed h-full p-4 space-y-6">
      <Link href="/" className="flex items-center gap-2 px-2">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold font-headline">AkiliPesa</h1>
      </Link>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {mainNavLinks.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link href={href}>
                <Button
                  variant={pathname.startsWith(href) && href !=='/' || pathname === href ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-lg h-12"
                >
                  <Icon className="mr-3 h-6 w-6" />
                  {label}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4">
        <h2 className="px-2 text-sm font-semibold text-muted-foreground tracking-wider uppercase">Following</h2>
        <ul className="space-y-2">
            {users.slice(1, 5).map(user => (
                <li key={user.id}>
                     <Link href={`/profile/${user.username}`}>
                        <Button variant="ghost" className="w-full justify-start h-11">
                            <UserAvatar src={user.avatar} username={user.username} className="h-8 w-8 mr-3" />
                            <span className='truncate'>{user.name}</span>
                        </Button>
                    </Link>
                </li>
            ))}
        </ul>
      </div>

      <div className="mt-auto">
        <Link href={`/profile/${users[0].username}`}>
          <Button variant="outline" className="w-full justify-start h-14">
            <UserAvatar src={users[0].avatar} username={users[0].username} className="h-10 w-10 mr-3" />
            <div className='text-left'>
                <p className='font-bold'>{users[0].name}</p>
                <p className='text-muted-foreground text-sm'>@{users[0].username}</p>
            </div>
          </Button>
        </Link>
      </div>
    </aside>
  );
}
