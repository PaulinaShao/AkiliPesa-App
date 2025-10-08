import { getAuth, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { initializeFirebase } from "@/firebase";

const { auth } = initializeFirebase();

// Google sign-in (web)
export async function signInWithGoogleWeb() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// Phone sign-in (web)
export async function startPhoneSignInWeb(phoneE164: string, recaptchaContainerId: string): Promise<ConfirmationResult> {
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" });
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}
