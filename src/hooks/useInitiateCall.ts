'use client';

import { useRouter } from 'next/navigation';
import { useFirebase, useFirebaseUser } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';

interface InitiateCallProps {
    mode: 'audio' | 'video';
    agentId: string;
    agentType: 'admin' | 'user';
}

export function useInitiateCall() {
    const router = useRouter();
    const { functions } = useFirebase();
    const { user: currentUser } = useFirebaseUser();
    const { toast } = useToast();

    const initiateCall = async ({ mode, agentId, agentType }: InitiateCallProps) => {
        if (!currentUser) {
            toast({
                variant: "destructive",
                title: "Login Required",
                description: "You must be logged in to make a call.",
            });
            router.push('/auth/login');
            return;
        }

        if (!functions) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Calling service not available.",
            });
            return;
        }

        try {
            const createAiCallSession = httpsCallable(functions, 'createAiCallSession');
            const result = await createAiCallSession({ agentId, agentType, mode });
            
            const { sessionId } = result.data as any;

            const query = new URLSearchParams({
                agentId,
                callId: sessionId,
            }).toString();

            router.push(`/call/${mode}?${query}`);

        } catch (error: any) {
            console.error('Error initiating call session:', error);
            toast({
                variant: "destructive",
                title: "Call Failed",
                description: error.message || "Could not initiate the call session. Please try again.",
            });
        }
    };

    return { initiateCall };
}
