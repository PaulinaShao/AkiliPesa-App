'use client';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';

export function useInitiateCall() {
  const { functions } = useFirebase();
  const router = useRouter();

  return async function initiate(agentId: string, agentType: 'admin'|'user'|'agent'|'ai', mode: 'audio'|'video', roomType?: 'classroom'|'meeting'|'live') {
    if (!functions) {
        console.error("Firebase Functions not available.");
        return;
    }
    const fn = httpsCallable(functions, 'callSessionHandler');
    try {
        const res: any = await fn({ agentId, agentType, mode, roomType });
        const { callId, channelName, token, appId } = res.data;
        const qs = new URLSearchParams({ callId, channelName, token, appId });
        router.push(`/call/${mode}?${qs.toString()}`);
    } catch (error) {
        console.error("Failed to initiate call:", error);
        // Optionally show a toast notification to the user
    }
  };
}
