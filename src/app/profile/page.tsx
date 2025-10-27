'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';

export default function ProfileRedirectPage() {
  const { user, isUserLoading } = useFirebaseUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      // Wait until user status is resolved
      return;
    }
    
    if (user) {
      // If user is logged in, redirect to their dynamic profile page using their handle.
      // Assuming user object from useFirebaseUser contains a `handle` or you can derive it.
      // The `onusercreate` function should be populating this field.
      const handle = (user as any).handle || user.displayName?.replace(/\s+/g, '') || user.uid;
      router.replace(`/${handle}`);
    } else {
      // If user is not logged in, redirect to the login page.
      router.replace('/auth/login');
    }
  }, [user, isUserLoading, router]);
  
  return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p>Loading profile...</p>
      </div>
  );
}
