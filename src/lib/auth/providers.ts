import { getAuth, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";

// Google sign-in (web)
export async function signInWithGoogleWeb() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// Phone sign-in (web)
export async function startPhoneSignInWeb(phoneE164: string, recaptchaContainerId: string): Promise<ConfirmationResult> {
  const auth = getAuth();
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" });
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}
