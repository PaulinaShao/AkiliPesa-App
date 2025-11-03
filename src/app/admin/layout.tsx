
'use client';

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

  // The root layout already shows a loading screen, so we just need to handle the redirect logic here.
  // This effect will run once the global isUserLoading becomes false.
  if (!isUserLoading) {
    if (!user) {
      // Use router.replace inside the render cycle is not ideal, but for a client component redirect like this it's a common pattern.
      // For Next.js 13+, middleware or server-side redirects are preferred for initial loads,
      // but this handles client-side transitions.
      router.replace(`/auth/login?redirect=${pathname}`);
      return null;
    }
    
    if (user.email !== 'blagridigital@gmail.com') {
      router.replace('/'); 
      return null;
    }
  }

  // Don't render children if we are still loading or if the user is not the admin.
  // The root layout handles the "Authenticating..." screen.
  if (isUserLoading || user?.email !== 'blagridigital@gmail.com') {
    return null;
  }

  return <div className="dark">{children}</div>;
}
