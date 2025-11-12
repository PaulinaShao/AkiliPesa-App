import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { FirebaseProvider } from "@/firebase/provider";
import AppLayout from "@/components/AppLayout";
import { IncomingCallWatcher } from "@/components/IncomingCall";
import { PresenceWriter } from "@/firebase/presence";
import { NotificationsButton } from "@/components/NotificationsButton";

export const metadata: Metadata = {
  title: "AkiliPesa",
  description: "Discover and share short videos, connect, learn, and earn",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "font-body antialiased w-full max-w-full overflow-x-hidden",
          inter.variable
        )}
      >
        <FirebaseProvider>
          <PresenceWriter />
          <NotificationsButton />
          <AppLayout>{children}</AppLayout>
          <IncomingCallWatcher />
        </FirebaseProvider>

        <Toaster />
      </body>
    </html>
  );
}
