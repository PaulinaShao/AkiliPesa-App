'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';
import { setPostLoginRedirect } from '@/lib/redirect';

interface RequireAuthRedirectProps {
  children: ReactNode;
}

export default function RequireAuthRedirect({ children }: RequireAuthRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useFirebaseUser();

  useEffect(() => {
    // Wait until the authentication state is fully resolved
    if (isUserLoading) {
      return;
    }

    // If auth state is resolved and there's no user, redirect to login
    if (!user) {
      const target = setPostLoginRedirect(pathname);
      router.replace(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [user, isUserLoading, router, pathname]);

  // While auth is loading, show a consistent loading state
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p>Authenticating...</p>
      </div>
    );
  }

  // If auth is resolved and there IS a user, render the protected content
  if (user) {
    return <>{children}</>;
  }

  // If auth is resolved and there is NO user, render null while redirecting
  return null;
}
