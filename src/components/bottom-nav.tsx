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
  
  // Hide on create flow screens (except the main 'ai' one) and call screens
  const hideOnDeepCreate = /^\/create\/(camera|upload|edit|describe|preview)/.test(pathname) || /^\/call\/(audio|video)/.test(pathname);
  if(hideOnDeepCreate) {
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

          if (label === 'Create') {
            return (
              <Link href={finalHref} key={label} className="flex-1 relative -top-3">
                 <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 bg-gradient-tanzanite rounded-full p-0.5" style={{boxShadow: '0 0 15px 3px rgba(0,201,167,0.35)'}}>
                        <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
                             <Icon className="h-8 w-8 text-gradient" />
                        </div>
                    </div>
                </div>
              </Link>
            )
          }

          return (
            <Link href={finalHref} key={label} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors',
                  isActive && 'text-gradient'
                )}
              >
                <Icon className={cn("h-6 w-6", isActive && "text-gradient")} />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
