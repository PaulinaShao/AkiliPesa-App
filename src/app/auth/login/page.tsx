
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // Placeholder functions for auth logic
  const handleGoogleSignIn = async () => {
    // In a real app, you would call your Firebase auth function here
    console.log('Initiating Google Sign-In...');
    // e.g., await signInWithGoogleWeb();
    router.push('/'); // Redirect on success
  };

  const handlePhoneSignIn = () => {
    // In a real app, this would likely navigate to a more detailed phone input screen
    console.log('Initiating Phone Sign-In...');
    // e.g., router.push('/auth/phone');
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
