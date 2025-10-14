
"use client";

import { useSearchParams } from "next/navigation";
import RequireAuthRedirect from "@/components/RequireAuthRedirect";
import { Suspense, useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { PhoneOff } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

function AudioCallUI() {
    const params = useSearchParams();
    const targetId = params.get("to") || "AkiliPesa AI";
    const [callState, setCallState] = useState<"connecting" | "in-call" | "ended">("connecting");
    const [rtcClient, setRtcClient] = useState<any>(null);

    useEffect(() => {
        const initAgora = async () => {
            if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
                console.error("Agora App ID is not set in environment variables.");
                setCallState("ended");
                return;
            }
            try {
                const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                setRtcClient(client);
                // Placeholder join — a real app would fetch a token from a secure backend
                await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID, "akilipesa_audio_channel", null, null);
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
    }, []);

    const handleEndCall = () => {
        rtcClient?.leave();
        setCallState("ended");
        // Typically you'd navigate away here, e.g., router.back()
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
