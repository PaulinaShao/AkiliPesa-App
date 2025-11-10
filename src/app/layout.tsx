import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import AppLayout from '@/components/AppLayout';
import { IncomingCallWatcher } from '@/components/IncomingCall';
import { PresenceWriter } from '@/firebase/presence';

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
          <AppLayout>{children}</AppLayout>
          <IncomingCallWatcher />
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
