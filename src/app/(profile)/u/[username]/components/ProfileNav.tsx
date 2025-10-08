'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, Settings, Briefcase, ShoppingBag, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '', icon: Grid3x3, value: 'posts' },
    { href: 'agents', icon: Briefcase, value: 'agents' },
    { href: 'shop', icon: ShoppingBag, value: 'shop' },
    { href: 'orders', icon: Receipt, value: 'orders' },
    { href: 'settings', icon: Settings, value: 'settings' },
  ];

  // This will extract the base path, e.g., /u/financeWizard
  const basePath = pathname.split('/').slice(0, 3).join('/');

  const isCurrentPage = (href: string) => {
    if (href === '') {
      // It's the main profile page if the path is just /u/[username]
      return pathname === basePath;
    }
    return pathname.startsWith(`${basePath}/${href}`);
  };

  return (
    <div className="mt-4">
      <div className="grid w-full grid-cols-5 bg-transparent border-b rounded-none">
        {navItems.map(item => (
          <Link href={`${basePath}/${item.href}`} key={item.value}>
            <div
              className={cn(
                "flex justify-center items-center py-3 text-muted-foreground cursor-pointer",
                isCurrentPage(item.href) && "text-foreground border-b-2 border-foreground"
              )}
            >
              <item.icon />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
