
"use client";

import { useSearchParams } from "next/navigation";
import RequireAuthRedirect from "@/components/RequireAuthRedirect";
import { useEffect, useState, Suspense } from "react";
import AgoraRTC, { ICameraVideoTrack } from "agora-rtc-sdk-ng";
import { PhoneOff, VideoOff, MicOff } from "lucide-react";
import { useFirebase } from "@/firebase";
import { httpsCallable } from "firebase/functions";

function VideoCallUI() {
  const params = useSearchParams();
  const { functions } = useFirebase();

  const targetId = params.get("to") || "AkiliPesa AI";
  const callId = params.get("callId");
  const channelName = params.get("channelName");
  const token = params.get("token");
  const appId = params.get("appId");
  
  const [callState, setCallState] = useState<"connecting" | "in-call" | "ended">("connecting");
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const initAgoraVideo = async () => {
       if (!appId || !channelName || !token) {
            console.error("Agora call details are not set in search params.");
            setCallState("ended");
            return;
       }
      try {
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);
        await agoraClient.join(appId, channelName, token, null);
        
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        videoTrack.play("local-player");
        setLocalVideoTrack(videoTrack);
        
        // Also create and publish audio track
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([videoTrack, audioTrack]);

        setCallState("in-call");
      } catch (err) {
        console.error("Video call init failed:", err);
        setCallState("ended");
      }
    };
    initAgoraVideo();

    return () => {
      localVideoTrack?.stop();
      localVideoTrack?.close();
      client?.leave();
      setCallState("ended");
    };
  }, [appId, channelName, token]);

  const handleEndCall = async () => {
    localVideoTrack?.stop();
    localVideoTrack?.close();
    client?.leave();
    setCallState("ended");
    if (callId) {
        try {
            const endCallFn = httpsCallable(functions, 'endCall');
            // A more robust solution would calculate duration based on a start time.
            await endCallFn({ callId, seconds: 30 }); 
        } catch(e) {
            console.error("Error ending call:", e);
        }
    }
    window.history.back();
  }

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-[#0a0a0a] text-white relative">
      {/* Remote user video would go here */}
      <div className="w-full h-full bg-black flex items-center justify-center text-muted-foreground">
          <p>Waiting for {targetId}...</p>
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
