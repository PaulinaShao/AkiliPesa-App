'use client';

import { doc, Timestamp } from 'firebase/firestore';
import { useDoc, useFirestore, useFsMemo } from '@/firebase';

export type Availability = {
  isOnline: boolean;
  busy: boolean;
  slots?: { start: Timestamp; end: Timestamp }[];
};

export function useAgentAvailability(agentId: string) {
  const firestore = useFirestore();

  const availabilityDocRef = useFsMemo(() => {
    if (!firestore || !agentId) return null;
    return doc(firestore, 'agentAvailability', agentId);
  }, [firestore, agentId]);

  const { data, isLoading, error } = useDoc<Availability>(availabilityDocRef);

  return { availability: data, isLoading, error };
}
