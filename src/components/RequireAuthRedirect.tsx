'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface RequireAuthRedirectProps {
  children: ReactNode;
}

export default function RequireAuthRedirect({ children }: RequireAuthRedirectProps) {
  const { user, isUserLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || !user) {
    // This can be a global loading spinner/component
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p>Authenticating...</p>
        </div>
    );
  }

  return <>{children}</>;
}
