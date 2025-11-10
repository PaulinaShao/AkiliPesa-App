'use client';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';

export function useJoinCall() {
  const { functions } = useFirebase();
  return async function join(callId: string) {
    if (!functions) {
        console.error("Firebase Functions not available.");
        return null;
    }
    const fn = httpsCallable(functions, 'joinExistingCall');
    try {
        const res: any = await fn({ callId });
        return res.data as { appId: string; token: string; channelName: string; callId: string };
    } catch (error) {
        console.error("Failed to join call:", error);
        return null;
    }
  };
}
