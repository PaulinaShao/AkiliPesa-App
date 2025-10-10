'use client';

import { useState } from "react";
import { 
  auth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  db, 
  doc, 
  setDoc,
  getDoc
} from "@/firebase/client";
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

  const sendOtp = async () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const verifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      console.error("OTP send error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const verifyOtp = async () => {
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Assign 10 trial credits on first signup
        await setDoc(userRef, {
            uid: user.uid,
            phone: user.phoneNumber,
            wallet: { balance: 10, plan: "trial", lastDeduction: null, escrow: 0, credits: 10, expiry: null },
            createdAt: new Date().toISOString(),
        }, { merge: true });
      }

      router.push("/create/ai");
    } catch (err) {
      console.error("OTP verify error:", err);
      alert(`Error: ${err.message}`);
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
