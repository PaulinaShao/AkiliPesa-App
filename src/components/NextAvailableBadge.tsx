'use client';

import { useAgentAvailability } from '@/hooks/useAgentAvailability';
import { format } from 'date-fns';

export function NextAvailableBadge({ agentId }: { agentId: string }) {
  const { availability, isLoading } = useAgentAvailability(agentId);

  if (isLoading || !availability || !availability.slots || availability.slots.length === 0) {
    return null;
  }
  
  if (availability.isOnline && !availability.busy) {
      return <div className="text-xs text-green-400">Available Now</div>
  }

  const now = new Date();
  const nextSlot = availability.slots.find(slot => slot.end.toDate() > now);

  if (!nextSlot) {
    return <div className="text-xs text-muted-foreground">Not available soon</div>;
  }

  return (
    <div className="text-xs text-muted-foreground">
      Available at {format(nextSlot.start.toDate(), 'h:mm a')}
    </div>
  );
}
