
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';

/**
 * Redirects to /auth/login?redirect=<encodedPath> if not signed in.
 * Runs only once when auth state is resolved to avoid loops.
 */
export function useRequireAuth(redirectTo: string = '/profile') {
  const router = useRouter();
  const { user, isUserLoading } = useFirebaseUser();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;        // idempotent
    if (isUserLoading) return;                // wait for auth to resolve

    if (!user) {
      redirectedRef.current = true;
      const next = encodeURIComponent(redirectTo);
      router.replace(`/auth/login?redirect=${next}`);
    }
  }, [user, isUserLoading, router, redirectTo]);

  return { user, isUserLoading };
}
