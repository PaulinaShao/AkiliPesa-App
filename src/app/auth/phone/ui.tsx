"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPostLoginRedirect, setPostLoginRedirect } from "@/lib/redirect";

export default function PhoneUI() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState<any>(null);

  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const redirect = params.get("redirect");
    if (redirect) setPostLoginRedirect(decodeURIComponent(redirect));
  }, [params]);

  useEffect(() => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible"
      });
    }
  }, [auth]);

  const sendOtp = async () => {
    if (!auth || !phone) return;
    const verifier = (window as any).recaptchaVerifier;
    const result = await signInWithPhoneNumber(auth, phone, verifier);
    setConfirm(result);
  };

  const verifyOtp = async () => {
    if (!confirm || !otp) return;
    await confirm.confirm(otp);
    router.replace(getPostLoginRedirect("/"));
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.back()}>
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{confirm ? "Enter OTP" : "Phone Login"}</CardTitle>
          <CardDescription>{confirm ? "Enter the verification code" : "We’ll send you a One-Time Code."}</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {!confirm ? (
            <>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 6XX XXX XXX" />
              <Button onClick={sendOtp}>Send OTP</Button>
            </>
          ) : (
            <>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
              <Button onClick={verifyOtp}>Verify</Button>
            </>
          )}
        </CardContent>
      </Card>

      <div id="recaptcha-container"></div>
    </div>
  );
}
