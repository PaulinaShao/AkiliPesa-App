'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null
  , [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return; 

    if (!user) {
      router.replace(`/auth/login?redirect=${pathname}`);
    } else if (userProfile?.role !== 'admin') {
      router.replace('/'); 
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router, pathname]);

  if (isUserLoading || isProfileLoading || !userProfile || userProfile.role !== 'admin') {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p>Authenticating Admin...</p>
        </div>
    );
  }

  return <div className="dark">{children}</div>;
}
