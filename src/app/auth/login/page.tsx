'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  db, 
  doc, 
  setDoc, 
  getDoc 
} from '@/firebase/client';
import type { FirebaseError } from 'firebase/app';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // The onusercreate Firebase Function will handle creating the user document
        // with trial credits. This check is for client-side redirection.
      }

      router.push('/create/ai');
    } catch (err) {
      const error = err as FirebaseError;
      // This is a standard error when the user closes the popup.
      // We can safely ignore it and not log it as a console error.
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
