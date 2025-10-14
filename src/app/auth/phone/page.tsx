'use client';

import { useState } from "react";
import { useAuth } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PhoneLoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const sendOtp = async () => {
    if (!auth || !phone || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
    } catch (err) {
      console.error("OTP send error:", err);
      toast({ variant: "destructive", title: "Error", description: (err as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmationResult || !otp || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await confirmationResult.confirm(otp);
      router.push("/");
    } catch (err) {
      console.error("OTP verify error:", err);
      toast({ variant: "destructive", title: "Error", description: (err as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background dark">
       <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.back()}>
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{confirmationResult ? 'Enter OTP' : 'Enter Your Phone Number'}</CardTitle>
          <CardDescription>{confirmationResult ? 'We sent a code to your phone.' : 'We\'ll send you a one-time password (OTP).'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {!confirmationResult ? (
                <div className="grid gap-4">
                    <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="+255 123 456 789"
                        disabled={isSubmitting}
                    />
                    <Button onClick={sendOtp} disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send OTP'}
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    <Input 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        placeholder="Enter OTP" 
                        type="number"
                        disabled={isSubmitting}
                    />
                    <Button onClick={verifyOtp} disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
      <div id="recaptcha-container"></div>
    </div>
  );
}
