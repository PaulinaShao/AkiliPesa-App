
'use client';
import { Star } from 'lucide-react';
import { useAgentRating } from '@/hooks/useAgentRating';

export function RatingChip({ agentId }: { agentId: string }) {
    const { average, count, isLoading } = useAgentRating(agentId);

    if (isLoading) {
        return <div className="text-xs text-muted-foreground/50 h-4 w-16 animate-pulse rounded-full bg-muted-foreground/20"></div>;
    }

    if (count === 0) {
        return <div className="text-xs text-muted-foreground">No reviews</div>;
    }

    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="font-bold">{average.toFixed(1)}</span>
            <span>({count})</span>
        </div>
    );
}
