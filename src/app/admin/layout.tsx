
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseUser } from '@/firebase';
import { useEffect } from 'react';

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
    } else if (user.email !== 'blagridigital@gmail.com') {
      router.replace('/'); 
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || user?.email !== 'blagridigital@gmail.com') {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p>Authenticating Admin...</p>
        </div>
    );
  }

  return <div className="dark">{children}</div>;
}
