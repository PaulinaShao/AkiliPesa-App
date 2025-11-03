
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useFirebaseUser();

  useEffect(() => {
    if (isUserLoading) return; 

    if (!user) {
      router.replace(`/auth/login?redirect=${pathname}`); 
      return;
    }
    
    if (user.email !== 'blagridigital@gmail.com') {
      router.replace('/'); 
    }

  }, [user, isUserLoading, router, pathname]);

  const isLoading = isUserLoading;

  if (isLoading || user?.email !== 'blagridigital@gmail.com') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p>Verifying access...</p>
      </div>
    );
  }

  return <div className="dark">{children}</div>;
}
