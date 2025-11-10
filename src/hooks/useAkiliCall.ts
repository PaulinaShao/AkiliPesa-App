
'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { useFirebase } from "@/firebase";
import { createAgoraClient } from "@/lib/agoraClient";


export function useAkiliCall() {
  const { functions } = useFirebase();
  const [inCall, setInCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const localMicTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  const startCall = useCallback(async (sessionId: string, channelName: string, token: string, uid: string) => {
    if (!functions) return;
    setLoading(true);
    const client = createAgoraClient();
    agoraClientRef.current = client;

    // Listen for remote audio
    client.on("user-published", async (user, mediaType) => {
        if (mediaType === 'audio') {
            await client.subscribe(user, mediaType);
            user.audioTrack?.play();
        }
    });

    await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, channelName, token, uid);

    // Create microphone input
    const track = await AgoraRTC.createMicrophoneAudioTrack();
    localMicTrackRef.current = track;
    await client.publish([track]);

    // Tell Firebase to start the AI loop
    const callSessionHandler2 = httpsCallable(functions, "callSessionHandler2");
    await callSessionHandler2({ sessionId });

    setInCall(true);
    setLoading(false);
  }, [functions]);

  const endCall = useCallback(async () => {
    try {
      localMicTrackRef.current?.stop();
      localMicTrackRef.current?.close();
    } catch (e) {
      console.error("Error stopping mic track:", e);
    }

    try {
      await agoraClientRef.current?.leave();
    } catch (e) {
      console.error("Error leaving Agora channel:", e);
    }

    localMicTrackRef.current = null;
    agoraClientRef.current = null;
    setInCall(false);
  }, []);

  return { inCall, loading, startCall, endCall };
}
