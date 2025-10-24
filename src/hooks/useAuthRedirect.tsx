
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';
import { setPostLoginRedirect } from '@/lib/redirect';

export const useAuthRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useFirebaseUser();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (isUserLoading) {
      return; 
    }

    if (!user) {
      redirectedRef.current = true;
      // If no user, store the intended destination and redirect to login
      const target = setPostLoginRedirect(pathname);
      router.replace(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }

  }, [user, isUserLoading, router, pathname]);

  return { user, isUserLoading };
};
