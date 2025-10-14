
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

interface UserProfile {
  role?: string;
  // other fields
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const isLoading = isUserLoading || isProfileLoading;
    if (isLoading) return; // Wait until we have all the data

    if (!user) {
      router.replace(`/auth/login?redirect=${pathname}`); // Not logged in, send to login with redirect
      return;
    }

    if (userProfile?.role !== 'admin') {
      router.replace('/'); // Not an admin, send to home
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router, pathname]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || userProfile?.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p>Verifying access...</p>
      </div>
    );
  }

  return <div className="dark">{children}</div>;
}
