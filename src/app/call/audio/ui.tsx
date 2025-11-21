'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RequireAuthRedirect from '@/components/RequireAuthRedirect';
import { PhoneOff, Sparkles, Mic, MicOff, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import useAgoraConnection from '@/lib/agoraConnection';
import { useCallRoom } from '@/hooks/useCallRoom';
import { Button } from '@/components/ui/button';

function AudioCallUIInner() {
  const params = useSearchParams();
  const callId = params.get('callId');
  const channelName = params.get('channelName');
  const token = params.get('token');
  const appId = params.get('appId');
  const uid = params.get('uid');

  const { room, loading: roomLoading } = useCallRoom(callId!);
  const { connected, publishAudio, leave } = useAgoraConnection({
    appId,
    channelName,
    token,
    uid,
    mode: 'audio',
  });

  const [isMuted, setIsMuted] = useState(false);

  // Auto-publish mic once connected
  useEffect(() => {
    if (connected && room?.mode === 'audio') {
      publishAudio();
    }
  }, [connected, room?.mode, publishAudio]);

  const end = async () => {
    await leave();
    window.history.back();
  };

  const toggleMute = async () => {
    // You can later wire this to actual track.setEnabled(false)
    setIsMuted((v) => !v);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white p-4">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-gradient-to-tr from-[#4B0082] to-[#8F00FF] p-1.5 mb-6 shadow-2xl shadow-primary/30">
          <Avatar className="w-32 h-32 bg-background/80 p-1">
            <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
              <Sparkles className="w-16 h-16" />
            </div>
          </Avatar>
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {room ? `${room.roomType ?? ''} Audio Call` : 'Loading Call...'}
        </h2>
        <p className="text-gray-400 mb-8 capitalize">
          {roomLoading ? 'Initializing Session…' : connected ? 'Connected' : 'Connecting…'}
        </p>

        <div className="my-8 flex flex-wrap justify-center gap-4">
          {room?.participants?.map((p: any) => (
            <div key={p.uid} className="flex flex-col items-center gap-2 text-xs">
              <Avatar className="w-16 h-16">
                <Users />
              </Avatar>
              <p>
                {p.uid.slice(0, 6)}... ({p.role})
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 rounded-full w-16 h-16"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
          </Button>
          <Button
            className="bg-[#E63946] rounded-full w-20 h-20 flex items-center justify-center shadow-lg hover:bg-[#ff4d5e]"
            onClick={end}
          >
            <PhoneOff size={36} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 rounded-full w-16 h-16"
          >
            <Users size={28} />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">Call ID: {callId}</p>
      </div>
    </div>
  );
}

function AudioCallUI() {
  return (
    <RequireAuthRedirect>
      <Suspense fallback={<div>Loading…</div>}>
        <AudioCallUIInner />
      </Suspense>
    </RequireAuthRedirect>
  );
}

export default AudioCallUI;
