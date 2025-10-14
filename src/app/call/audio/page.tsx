
"use client";

import { useSearchParams } from "next/navigation";
import RequireAuthRedirect from "@/components/RequireAuthRedirect";
import { Suspense, useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { PhoneOff } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useFirebase } from "@/firebase";
import { httpsCallable } from "firebase/functions";

function AudioCallUI() {
    const params = useSearchParams();
    const { functions } = useFirebase();
    const targetId = params.get("to") || "AkiliPesa AI";
    const callId = params.get("callId");
    const channelName = params.get("channelName");
    const token = params.get("token");
    const appId = params.get("appId");
    const [callState, setCallState] = useState<"connecting" | "in-call" | "ended">("connecting");
    const [rtcClient, setRtcClient] = useState<any>(null);

    useEffect(() => {
        const initAgora = async () => {
            if (!appId || !channelName || !token) {
                 console.error("Agora call details are not set in search params.");
                 setCallState("ended");
                 return;
            }
            try {
                const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                setRtcClient(client);

                await client.join(appId, channelName, token, null);

                // Publish local audio
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                await client.publish([audioTrack]);

                // Listen for remote users
                client.on("user-published", async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (mediaType === "audio") {
                        user.audioTrack?.play();
                    }
                });

                setCallState("in-call");
            } catch (err) {
                console.error("Agora init error:", err);
                setCallState("ended");
            }
        };
        initAgora();

        return () => {
            rtcClient?.leave();
            rtcClient?.removeAllListeners();
        };
    }, [appId, channelName, token]);

    const handleEndCall = async () => {
        rtcClient?.leave();
        setCallState("ended");
        if (callId) {
            try {
                const endCallFn = httpsCallable(functions, 'endCall');
                // For simplicity, we'll assume a fixed duration or calculate it client-side.
                // A more robust solution would calculate this on the backend based on startTime.
                await endCallFn({ callId, seconds: 30 });
            } catch(e) {
                console.error("Error ending call:", e);
            }
        }
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
                <h2 className="text-3xl font-bold mb-2">Calling {targetId}</h2>
                <p className="text-gray-400 mb-8 capitalize">
                    {callState}
                </p>

                <div className="flex space-x-6">
                    <button
                        className="bg-[#E63946] rounded-full w-20 h-20 flex items-center justify-center shadow-lg hover:bg-[#ff4d5e] transition-colors"
                        onClick={handleEndCall}
                    >
                       <PhoneOff size={36} />
                    </button>
                </div>
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
