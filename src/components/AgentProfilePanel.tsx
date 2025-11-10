'use client';
import { useAgentAvailability } from "@/hooks/useAgentAvailability";
import { useAgentPricing } from "@/hooks/useAgentPricing";
import { useInitiateCall } from "@/hooks/useInitiateCall";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Video, MessageCircle } from "lucide-react";
import { NextAvailableBadge } from "./NextAvailableBadge";
import { CallPriceChip } from "./CallPriceChip";
import { useRouter } from "next/navigation";

interface AgentProfilePanelProps {
  agentId: string;
}

export function AgentProfilePanel({ agentId }: AgentProfilePanelProps) {
  const { availability, isLoading: availabilityLoading } = useAgentAvailability(agentId);
  const { initiateCall } = useInitiateCall();
  const router = useRouter();

  const handleCall = (mode: 'audio' | 'video') => {
    initiateCall({
      agentId,
      agentType: 'user', // Assuming public profiles are user agents
      mode,
    });
  };

  const handleMessage = () => {
    // This assumes the user's handle is the agentId for navigation
    // In a real app, you might need to fetch the user's handle from their profile
    router.push(`/inbox/${agentId}`);
  }

  if (availabilityLoading) {
    return <Card className="my-4"><CardContent className="pt-6 text-center">Loading agent info...</CardContent></Card>;
  }

  return (
    <Card className="my-4 bg-secondary/30 border-primary/20">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
            <span>Agent Control Panel</span>
            <NextAvailableBadge agentId={agentId} />
        </CardTitle>
        <CardDescription>
            Connect with this agent or view their availability.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button onClick={() => handleCall('audio')} variant="outline" className="flex-col h-20">
                <Phone className="h-6 w-6 mb-1"/>
                <span>Audio Call</span>
                <CallPriceChip agentId={agentId} mode="audio" />
            </Button>
            <Button onClick={() => handleCall('video')} variant="outline" className="flex-col h-20">
                <Video className="h-6 w-6 mb-1"/>
                <span>Video Call</span>
                 <CallPriceChip agentId={agentId} mode="video" />
            </Button>
             <Button onClick={handleMessage} variant="outline" className="flex-col h-20">
                <MessageCircle className="h-6 w-6 mb-1"/>
                <span>Message</span>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
