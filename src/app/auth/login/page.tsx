'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The onusercreate function and useUser hook will handle the rest.
      router.push('/create/ai');
    } catch (err) {
      const error = err as FirebaseError;
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("Google Sign-in error:", err);
    }
  };

  const handlePhoneSignIn = () => {
    router.push('/auth/phone');
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background dark">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to AkiliPesa</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={handleGoogleSignIn}>
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          <Button onClick={handlePhoneSignIn}>
            <Phone className="mr-2 h-4 w-4" />
            Continue with Phone
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
