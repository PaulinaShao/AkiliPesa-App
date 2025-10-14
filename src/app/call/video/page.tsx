
"use client";

import { useSearchParams } from "next/navigation";
import RequireAuthRedirect from "@/components/RequireAuthRedirect";
import { useEffect, useState, Suspense } from "react";
import AgoraRTC, { ICameraVideoTrack } from "agora-rtc-sdk-ng";
import { PhoneOff, VideoOff, MicOff } from "lucide-react";

function VideoCallUI() {
  const params = useSearchParams();
  const targetId = params.get("to") || "AkiliPesa AI";
  const [callState, setCallState] = useState<"connecting" | "in-call" | "ended">("connecting");
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const initAgoraVideo = async () => {
       if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
            console.error("Agora App ID is not set in environment variables.");
            setCallState("ended");
            return;
       }
      try {
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);
        await agoraClient.join(process.env.NEXT_PUBLIC_AGORA_APP_ID, "akilipesa_video_channel", null, null);
        
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
  }, []);

  const handleEndCall = () => {
    localVideoTrack?.stop();
    localVideoTrack?.close();
    client?.leave();
    setCallState("ended");
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

