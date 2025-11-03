'use client';

import { usePathname } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';
import { SidebarNav } from './sidebar-nav';
import { BottomNavWrapper } from './bottom-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useFirebaseUser();
  const pathname = usePathname();

  const showNav = ![
    '/auth/login',
    '/auth/phone'
  ].includes(pathname);

  if (isUserLoading && showNav) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p>Authenticating...</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      {showNav && <SidebarNav user={user} isLoading={isUserLoading} />}
      <div className="flex flex-col flex-1 w-full overflow-x-hidden">
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
        {showNav && <BottomNavWrapper />}
      </div>
    </div>
  );
}
