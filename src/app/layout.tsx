'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { SidebarNav } from '@/components/sidebar-nav';
import { BottomNavWrapper } from '@/components/bottom-nav';
import { FirebaseClientProvider, useFirebaseUser } from '@/firebase';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Since the root layout is now a client component, we can't export metadata directly.
// This can be moved to a Head tag inside the component if needed, or this file can wrap a server component.
// For now, we remove it to fix the build.

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isUserLoading } = useFirebaseUser();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>AkiliPesa</title>
        <meta name="description" content="Discover and share short videos" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased w-full max-w-full overflow-x-hidden', inter.variable)}>
          <div className="flex min-h-screen">
            <SidebarNav user={user} isLoading={isUserLoading} />
            <main className="flex-1 md:ml-64 w-full max-w-full overflow-x-hidden">
              {isUserLoading ? (
                 <div className="flex h-screen w-full items-center justify-center bg-background dark">
                    <p>Authenticating...</p>
                 </div>
              ) : children }
            </main>
            <BottomNavWrapper />
          </div>
          <Toaster />
      </body>
    </html>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <AppLayout>{children}</AppLayout>
    </FirebaseClientProvider>
  )
}
