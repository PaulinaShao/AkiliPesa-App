import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import AppLayout from '@/components/AppLayout';
import { IncomingCallWatcher } from '@/components/IncomingCall';
import { PresenceWriter } from '@/firebase/presence';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { enableWebPushAndSaveToken } from '@/firebase/notifications';

export const metadata: Metadata = {
  title: 'AkiliPesa',
  description: 'Discover and share short videos',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn('font-body antialiased w-full max-w-full overflow-x-hidden', inter.variable)}>
        <FirebaseClientProvider>
          <PresenceWriter />
          <div className="fixed bottom-20 right-4 z-50">
            <Button onClick={enableWebPushAndSaveToken} size="sm" variant="outline">
                <Bell className="mr-2 h-4 w-4" /> Enable Notifications
            </Button>
          </div>
          <AppLayout>{children}</AppLayout>
          <IncomingCallWatcher />
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
