'use client';
import { useAgentPricing } from "@/hooks/useAgentPricing";

export function CallPriceChip({ agentId, mode }: { agentId: string; mode: 'audio' | 'video'}) {
    const { pricing, isLoading } = useAgentPricing(agentId);

    if (isLoading || !pricing) {
        return <div className="text-xs text-muted-foreground/50 h-4 w-12 animate-pulse rounded-full bg-muted-foreground/20"></div>;
    }

    const price = mode === 'audio' ? pricing.audio_per_min : pricing.video_per_min;

    return (
        <div className="text-xs text-muted-foreground">
            {price}c/min
        </div>
    )
}
