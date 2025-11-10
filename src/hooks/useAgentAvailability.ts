'use client';
import { useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { doc, Timestamp } from 'firebase/firestore';

export type Availability = {
  isOnline: boolean;
  busy: boolean;
  slots?: { start: Timestamp; end: Timestamp }[];
};

export function useAgentAvailability(agentId: string) {
  const firestore = useFirestore();
  const availabilityDocRef = useMemoFirebase(() => {
    if (!firestore || !agentId) return null;
    return doc(firestore, 'agentAvailability', agentId);
  }, [firestore, agentId]);
  
  const { data, isLoading, error } = useDoc<Availability>(availabilityDocRef);

  return { availability: data, isLoading, error };
}
