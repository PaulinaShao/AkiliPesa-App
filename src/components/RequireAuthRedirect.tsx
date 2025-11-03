'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';
import type { ReactNode } from 'react';

interface RequireAuthRedirectProps {
  children: ReactNode;
}

/**
 * DEPRECATED: This component's logic has been lifted into the root layout.
 * It is no longer necessary and will be removed in a future cleanup.
 * The root layout now handles the primary 'Authenticating...' state and
 * individual pages are responsible for their own redirect logic if needed.
 */
export default function RequireAuthRedirect({ children }: RequireAuthRedirectProps) {
  const { user, isUserLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  // The root layout now handles the global loading state.
  // This component's main job is to redirect if, after loading, there's no user.
  if (!isUserLoading && !user) {
    router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    return null; // Render nothing while redirecting
  }

  // If a user exists, render the children. The loading state is handled by the parent layout.
  if (user) {
     return <>{children}</>;
  }

  // If still loading, render nothing, as the root layout is showing the loading indicator.
  return null;
}
