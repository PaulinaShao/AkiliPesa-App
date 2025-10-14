
"use client";

import { useSearchParams } from "next/navigation";
import RequireAuthRedirect from "@/components/RequireAuthRedirect";
import { Suspense, useEffect } from "react";
import { PhoneOff } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import useSessionManager from "@/lib/sessionManager";
import useAgoraConnection from "@/lib/agoraConnection";

function AudioCallUI() {
    const params = useSearchParams();
    const agentId = params.get("agentId") || "akilipesa-ai";
    const callId = params.get("callId");

    // The channel name is derived from the callId to ensure it's unique per call
    const { session, loading: sessionLoading, updateSession } = useSessionManager(agentId, "audio");
    const { connected, publishAudio } = useAgoraConnection(callId);

    useEffect(() => {
        if (connected && session?.isActive) {
            publishAudio();
            updateSession({ lastUpdated: Date.now() });
        }
    }, [connected, session, publishAudio, updateSession]);

    const handleEndCall = () => {
        updateSession({ isActive: false });
        // A real implementation would also call the endCall Firebase Function here.
        window.history.back();
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white">
            <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-gradient-to-tr from-[#4B0082] to-[#8F00FF] p-1.5 mb-6 shadow-2xl shadow-primary/30">
                     <Avatar className="w-32 h-32 bg-background/80 p-1">
                        <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
                            <Sparkles className="w-16 h-16 text-gradient" />
                        </div>
                    </Avatar>
                </div>
                <h2 className="text-3xl font-bold mb-2">Calling {agentId}</h2>
                <p className="text-gray-400 mb-8 capitalize">
                    {sessionLoading ? "Initializing Session..." : connected ? "Connected" : "Connecting..."}
                </p>

                <div className="flex space-x-6">
                    <button
                        className="bg-[#E63946] rounded-full w-20 h-20 flex items-center justify-center shadow-lg hover:bg-[#ff4d5e] transition-colors"
                        onClick={handleEndCall}
                    >
                       <PhoneOff size={36} />
                    </button>
                </div>
                 <p className="text-xs text-muted-foreground mt-6">Session ID: {session?.sessionId}</p>
            </div>
        </div>
    );
}

export default function AudioCallPage() {
    return (
        <RequireAuthRedirect>
            <Suspense fallback={<div>Loading...</div>}>
                <AudioCallUI />
            </Suspense>
        </RequireAuthRedirect>
    );
}
