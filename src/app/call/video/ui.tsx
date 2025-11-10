'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RequireAuthRedirect from '@/components/RequireAuthRedirect';
import { PhoneOff, VideoOff, MicOff, Video, Mic, Users, LayoutGrid, Star, User } from 'lucide-react';
import useAgoraConnection from '@/lib/agoraConnection';
import { useCallRoom } from '@/hooks/useCallRoom';
import { useJoinCall } from '@/lib/useJoinCall';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// --- Layout Components ---
function GridLayout({ participants, localId, remoteVideoEl }: any) {
    return <div id="video-grid" className="grid grid-cols-2 gap-2 flex-1 p-2">
        <div id={`local-player-${localId}`} className="bg-black rounded-lg w-full h-full"></div>
        {participants.filter((p:any) => p.uid !== localId).map((p:any) => (
             <div key={p.uid} id={`remote-player-${p.uid}`} className="bg-black rounded-lg w-full h-full"></div>
        ))}
    </div>;
}

function SpotlightLayout({ participants, localId, hostId }: any) {
    const spotlightUser = participants.find((p:any) => p.uid === hostId) || participants[0];
    return <div className="flex-1 flex flex-col p-2 gap-2">
        <div id={`video-${spotlightUser.uid}`} className="bg-black rounded-lg flex-1"></div>
        <div className="flex gap-2 h-24">
            {participants.filter((p:any) => p.uid !== spotlightUser.uid).map((p:any) => (
                 <div key={p.uid} id={`video-${p.uid}`} className="bg-black rounded-lg aspect-video"></div>
            ))}
        </div>
    </div>;
}

function SpeakerLayout({ participants, localId }: any) {
    // Logic to determine active speaker would go here, for now just shows host
    return <SpotlightLayout participants={participants} localId={localId} hostId={participants.find((p:any) => p.role === 'host')?.uid} />;
}

// --- Main UI Component ---
function VideoCallUI() {
  const params = useSearchParams();
  const router = useRouter();
  const initialCallId = params.get('callId');
  const joinCall = useJoinCall();

  const [callConfig, setCallConfig] = useState<{appId: string, token: string, channelName: string, callId: string} | null>(null);

  useEffect(() => {
      const init = async () => {
          if(params.get('token')) { // Fresh call
              setCallConfig({
                  appId: params.get('appId')!,
                  token: params.get('token')!,
                  channelName: params.get('channelName')!,
                  callId: initialCallId!
              });
          } else if (initialCallId) { // Joining via invite
              const config = await joinCall(initialCallId);
              if (config) setCallConfig(config);
              else router.push('/'); // Call not found
          }
      };
      init();
  }, [initialCallId, params, joinCall, router]);

  const { room, loading: roomLoading, isHost, setLayoutMode } = useCallRoom(callConfig?.callId!);
  const { connected, publishVideo, publishAudio, localVideoTrack, leave } = useAgoraConnection(callConfig?.channelName);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    if (connected && room?.mode === 'video') {
      publishVideo().then(track => {
          if (track) {
              const localPlayer = document.getElementById(`video-${room.participants.find(p => p.role === 'host')?.uid}`);
              if(localPlayer) track.play(localPlayer);
          }
      });
      publishAudio();
    }
  }, [connected, room, publishVideo, publishAudio]);

  const end = async () => {
    await leave(callConfig?.callId);
    router.push('/');
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleCamera = () => {
      localVideoTrack?.setEnabled(!isCameraOn);
      setIsCameraOn(!isCameraOn);
  };
  
  const renderLayout = () => {
      if (!room) return null;
      switch(room.layoutMode) {
          case 'grid': return <GridLayout participants={room.participants} localId={isHost ? room.hostId : ''}/>
          case 'spotlight': return <SpotlightLayout participants={room.participants} localId={isHost ? room.hostId : ''} hostId={room.hostId}/>
          case 'speaker': return <SpeakerLayout participants={room.participants} localId={isHost ? room.hostId : ''} />
          default: return <GridLayout participants={room.participants} localId={isHost ? room.hostId : ''}/>
      }
  }

  if (!callConfig || roomLoading) {
      return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading Call...</div>
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white relative">
        {renderLayout()}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-4 z-10 bg-black/50 p-3 rounded-full border border-white/20 backdrop-blur-sm">
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={toggleMute}>
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={toggleCamera}>
                {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
            </Button>
            <Button className="bg-[#E63946] hover:bg-[#ff4d5e] rounded-full w-14 h-14" size="icon" onClick={end}>
              <PhoneOff size={28} />
            </Button>
            {isHost && (
                <>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full w-14 h-14"><Users size={24}/></Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader><SheetTitle>Invite Participants</SheetTitle></SheetHeader>
                        {/* Invite component would go here */}
                    </SheetContent>
                </Sheet>
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full w-14 h-14"><LayoutGrid size={24}/></Button>
                    </SheetTrigger>
                    <SheetContent side="bottom">
                        <SheetHeader><SheetTitle>Change Layout</SheetTitle></SheetHeader>
                        <div className="grid grid-cols-3 gap-4 p-4">
                            <Button variant="outline" onClick={() => setLayoutMode('grid')}><LayoutGrid className="mr-2"/>Grid</Button>
                            <Button variant="outline" onClick={() => setLayoutMode('spotlight')}><User className="mr-2"/>Spotlight</Button>
                            <Button variant="outline" onClick={() => setLayoutMode('speaker')}><Star className="mr-2"/>Speaker</Button>
                        </div>
                    </SheetContent>
                </Sheet>
                </>
            )}
        </div>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuthRedirect>
      <Suspense fallback={<div>Loading Call...</div>}>
        <VideoCallUI />
      </Suspense>
    </RequireAuthRedirect>
  );
}
