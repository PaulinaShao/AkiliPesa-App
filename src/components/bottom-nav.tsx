
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, PlusSquare, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/create/ai', icon: PlusSquare, label: 'Create' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/u/financeWizard', icon: User, label: 'Profile' },
];

export function BottomNavWrapper() {
  const pathname = usePathname();
  
  // Hide nav on any deep inbox (chat) pages.
  const showNav = !/^\/inbox\/[^/]+$/.test(pathname) && !pathname.startsWith('/inbox/akilipesa-ai');


  if (!showNav) {
    return null;
  }
  
  // Hide on create flow screens, which have their own tab nav
  const hideOnCreate = pathname.startsWith('/create');
  if(hideOnCreate) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navLinks.map(({ href, icon: Icon, label }) => {
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
          
          const finalHref = label === 'Profile' ? `/u/financeWizard` : href;

          return (
            <Link href={finalHref} key={label} className="flex-1">
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
