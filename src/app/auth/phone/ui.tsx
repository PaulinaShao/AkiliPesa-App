'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPostLoginRedirect, setPostLoginRedirect } from '@/lib/redirect';

export default function PhoneUI() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cr, setCr] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    const q = params.get('redirect');
    if (q) setPostLoginRedirect(decodeURIComponent(q));
  }, [params]);

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    }
  }, []);

  const sendOtp = async () => {
    if (!phone || submitting) return;
    setSubmitting(true);
    try {
      const verifier = (window as any).recaptchaVerifier;
      const _cr = await signInWithPhoneNumber(auth, phone, verifier);
      setCr(_cr);
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    if (!cr || !otp || submitting) return;
    setSubmitting(true);
    try {
      await cr.confirm(otp);
      router.replace(getPostLoginRedirect('/'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{cr ? 'Enter OTP' : 'Phone sign in'}</CardTitle>
          <CardDescription>{cr ? 'We sent a code to your phone.' : 'We will send an OTP.'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!cr ? (
            <>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 123 456 789" />
              <Button onClick={sendOtp} disabled={submitting}>{submitting ? 'Sending…' : 'Send OTP'}</Button>
            </>
          ) : (
            <>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" inputMode="numeric" />
              <Button onClick={verify} disabled={submitting}>{submitting ? 'Verifying…' : 'Verify & Continue'}</Button>
            </>
          )}
        </CardContent>
      </Card>
      <div id="recaptcha-container" />
    </div>
  );
}
