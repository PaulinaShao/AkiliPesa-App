
"use client";

import { useSearchParams } from "next/navigation";
import RequireAuthRedirect from "@/components/RequireAuthRedirect";
import { useEffect, Suspense } from "react";
import { PhoneOff, VideoOff, MicOff } from "lucide-react";
import useSessionManager from "@/lib/sessionManager";
import useAgoraConnection from "@/lib/agoraConnection";

function VideoCallUI() {
  const params = useSearchParams();
  const agentId = params.get("agentId") || "akilipesa-ai";
  const callId = params.get("callId");

  const { session, loading: sessionLoading, updateSession } = useSessionManager(agentId, "video");
  const { connected, publishVideo, publishAudio, localVideoTrack } = useAgoraConnection(callId);

  useEffect(() => {
    if (connected && session?.isActive) {
      publishVideo().then(track => {
        if(track) track.play("local-player");
      });
      publishAudio();
      updateSession({ lastUpdated: Date.now() });
    }
  }, [connected, session, publishVideo, publishAudio, updateSession]);

  const handleEndCall = () => {
    localVideoTrack?.stop();
    updateSession({ isActive: false });
    // A real implementation would also call the endCall Firebase Function here.
    window.history.back();
  }

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-[#0a0a0a] text-white relative">
      
      {/* Remote user video would go here */}
      <div className="w-full h-full bg-black flex items-center justify-center text-muted-foreground">
          <p>{connected ? `Waiting for ${agentId}...` : "Connecting..."}</p>
      </div>

      {/* Local user preview */}
      <div id="local-player" className="absolute w-32 h-48 top-4 right-4 bg-gray-800 rounded-lg overflow-hidden border-2 border-primary"></div>
      
      <div className="absolute bottom-8 flex space-x-6 z-10">
        <button className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center shadow-md hover:bg-white/30">
            <MicOff size={28} />
        </button>
        <button className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center shadow-md hover:bg-white/30">
            <VideoOff size={28} />
        </button>
        <button
          className="bg-[#E63946] rounded-full w-16 h-16 flex items-center justify-center shadow-md hover:bg-[#ff4d5e]"
          onClick={handleEndCall}
        >
          <PhoneOff size={32} />
        </button>
      </div>

      {sessionLoading && <div className="absolute top-4 left-4 text-xs">Initializing session...</div>}
       <p className="absolute bottom-2 left-2 text-xs text-muted-foreground">Session ID: {session?.sessionId}</p>
    </div>
  );
}

export default function VideoCallPage() {
    return (
        <RequireAuthRedirect>
            <Suspense fallback={<div>Loading...</div>}>
                <VideoCallUI />
            </Suspense>
        </RequireAuthRedirect>
    );
}
