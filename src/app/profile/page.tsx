'use client';

import { useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useRouter } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';


export default function ProfileRedirectPage() {
  const { user, isUserLoading } = useRequireAuth('/profile');
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; 
    }
    if (user) {
      const handle = user.displayName?.replace(/\s+/g, '') || user.uid;
      router.replace(`/${handle}`);
    }
  }, [user, isUserLoading, router]);
  
  return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p>Loading profile...</p>
      </div>
  );
}
