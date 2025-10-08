'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, PlusSquare, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/upload', icon: PlusSquare, label: 'Create' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/profile/naturelover', icon: User, label: 'Profile' },
];

export function BottomNavWrapper() {
  const pathname = usePathname();
  
  // Hide nav on upload, edit, and any deep inbox (chat) pages.
  const showNav = !pathname.startsWith('/upload') && !pathname.startsWith('/edit') && (pathname === '/inbox' || !pathname.startsWith('/inbox/'));

  if (!showNav) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navLinks.map(({ href, icon: Icon, label }) => {
          const isActive = (href === '/' && pathname === '/') || (href !== '/' && pathname.startsWith(href));
          return (
            <Link href={href} key={label} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors',
                  isActive && 'text-primary'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
