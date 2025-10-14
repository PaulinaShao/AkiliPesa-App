'use client';

import { useState } from "react";
import { useAuth } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function PhoneLoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();
  const auth = useAuth();

  const sendOtp = async () => {
    if (!auth) return;
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      console.error("OTP send error:", err);
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmationResult.confirm(otp);
      router.push("/create/ai");
    } catch (err) {
      console.error("OTP verify error:", err);
      alert(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background dark">
       <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.back()}>
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enter Your Phone Number</CardTitle>
          <CardDescription>We'll send you a one-time password (OTP).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {!otpSent ? (
                <div className="grid gap-4">
                    <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="+255 123 456 789" 
                    />
                    <Button onClick={sendOtp}>
                        Send OTP
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    <Input 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        placeholder="Enter OTP" 
                        type="number"
                    />
                    <Button onClick={verifyOtp}>
                        Verify & Continue
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
      <div id="recaptcha-container"></div>
    </div>
  );
}
