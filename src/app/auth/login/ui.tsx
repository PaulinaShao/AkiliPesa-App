'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome, Phone } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, type User } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { useFirebaseUser } from '@/firebase';
import { auth } from '@/firebase';
import { getPostLoginRedirect, setPostLoginRedirect } from '@/lib/redirect';

export default function LoginUI() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isUserLoading } = useFirebaseUser();

  useEffect(() => {
    const q = params.get('redirect');
    if (q) setPostLoginRedirect(decodeURIComponent(q));
  }, [params]);

  const handleSuccess = (u: User) => {
    const dest = getPostLoginRedirect('/profile');
    router.replace(dest);
  };

  useEffect(() => {
    if (!auth || isUserLoading) return;
    if (user) return handleSuccess(user);

    getRedirectResult(auth).then((res) => {
      if (res?.user) handleSuccess(res.user);
    }).catch((e) => console.warn('Redirect sign-in error', e));
  }, [user, isUserLoading, router]);

  const google = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      handleSuccess(res.user);
    } catch (err) {
      const e = err as FirebaseError;
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
      } else if (e.code !== 'auth/popup-closed-by-user') {
        console.error(err);
      }
    }
  };

  const phone = () => router.push('/auth/phone');

  if (isUserLoading || user) {
    return <div className="flex h-screen items-center justify-center">Authenticating…</div>;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to AkiliPesa</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={google}>
            <Chrome className="mr-2 h-4 w-4" /> Continue with Google
          </Button>
          <Button onClick={phone}>
            <Phone className="mr-2 h-4 w-4" /> Continue with Phone
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
