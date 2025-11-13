'use client';

import { useDoc, useFirestore, useFsMemo } from '@/firebase';
import { doc } from 'firebase/firestore';

export type AgentPricing = {
  audio_per_min: number;
  video_per_min: number;
  commission_rate: number;
};

export function useAgentPricing(agentId: string) {
  const firestore = useFirestore();

  const pricingDocRef = useFsMemo(() => {
    if (!firestore || !agentId) return null;
    return doc(firestore, 'agentPricing', agentId);
  }, [firestore, agentId]);

  const { data, isLoading, error } = useDoc<AgentPricing>(pricingDocRef);

  return { pricing: data, isLoading, error };
}
