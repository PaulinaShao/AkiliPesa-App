'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AgentPicker } from '@/components/AgentPicker';

function VideoCallComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [callDetails, setCallDetails] = useState<any>(null);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const agentVideoRef = useRef<HTMLVideoElement>(null); // This would be the remote stream

  const agentId = searchParams.get('agentId');
  const agentType = searchParams.get('agentType');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const setupDevicesAndCall = async (id: string, type: string) => {
      // Get Agent Info
      let agentDocRef = doc(firestore, type === 'admin' ? 'adminAgents' : `users/${user.uid}/agents`, id);
      const agentSnap = await getDoc(agentDocRef);

      if (!agentSnap.exists()) {
        toast({ variant: 'destructive', title: 'Agent not found' });
        router.back();
        return;
      }
      setAgent(agentSnap.data());
      
      // Get Camera/Mic permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Device Access Denied', description: 'Please enable camera and microphone permissions.' });
        router.back();
        return;
      }
      
      // Get Agora Token
      const functions = getFunctions();
      const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
      try {
        const result: any = await getAgoraToken({ agentId: id, agentType: type, mode: 'video' });
        setCallDetails(result.data);
        // TODO: Initialize Agora with token and join channel
      } catch (error) {
        toast({ variant: 'destructive', title: 'Call Failed', description: 'Could not start the call.' });
        console.error("Error getting Agora token:", error);
      }
    };

    if (agentId && agentType) {
      setupDevicesAndCall(agentId, agentType);
    } else {
      setShowPicker(true);
    }

    return () => {
      // Cleanup: stop media tracks on component unmount
      if (userVideoRef.current?.srcObject) {
        const stream = userVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user, isUserLoading, agentId, agentType, router, firestore, toast]);

  const handleAgentSelect = (selectedAgent: { id: string, type: string }) => {
    setShowPicker(false);
    router.push(`/call/video?agentId=${selectedAgent.id}&agentType=${selectedAgent.type}`);
  };

  const handleEndCall = async () => {
    if (callDetails?.callId) {
      const functions = getFunctions();
      const endCall = httpsCallable(functions, 'endCall');
      await endCall({ callId: callDetails.callId }).catch(e => console.error("Error ending call:", e));
    }
    // TODO: Leave Agora channel
    router.push('/');
  };

  const toggleCamera = () => {
    if (userVideoRef.current?.srcObject) {
      const stream = userVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMute = () => {
    if (userVideoRef.current?.srcObject) {
      const stream = userVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      setIsMuted(!isMuted);
    }
  };
  
  if (showPicker) {
      return <AgentPicker show={true} onSelect={handleAgentSelect} onCancel={() => router.back()} />;
  }

  if (isUserLoading || !agent) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <p className="text-white">Setting up call...</p>
      </div>
    );
  }

  return (
    <div className="dark relative flex h-screen w-full flex-col items-center justify-between bg-black">
      <video ref={agentVideoRef} className="h-full w-full object-cover" playsInline autoPlay muted style={{ backgroundColor: '#222' }} />
      
      <div className="absolute right-4 top-4 h-48 w-32 overflow-hidden rounded-lg border-2 border-secondary">
        <video ref={userVideoRef} className={cn('h-full w-full object-cover', !isCameraOn && 'hidden')} playsInline autoPlay muted />
        {!isCameraOn && (
            <div className="h-full w-full flex items-center justify-center bg-black">
                <VideoOff className="h-8 w-8 text-muted-foreground"/>
            </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6">
        <Button variant="secondary" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30" onClick={toggleMute}>
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </Button>
        <Button variant="secondary" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30" onClick={toggleCamera}>
          {isCameraOn ? <Video size={28} /> : <VideoOff size={28} />}
        </Button>
        <Button variant="destructive" size="icon" className="h-16 w-16 rounded-full" onClick={handleEndCall}>
          <PhoneOff size={32} />
        </Button>
      </div>
    </div>
  );
}

export default function VideoCallPage() {
    return (
        <Suspense fallback={<div className="dark flex h-screen w-full items-center justify-center bg-black"><p>Loading...</p></div>}>
            <VideoCallComponent />
        </Suspense>
    )
}
