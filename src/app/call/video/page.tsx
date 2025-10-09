
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function VideoCallPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const agentVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const setupCamera = async () => {
      if (user) {
        // TODO: Check wallet balance
        // const userProfile = await getUserProfile(user.uid);
        // if (userProfile.wallet.balance <= 0) {
        //   router.push('/wallet?recharge=true');
        //   return;
        // }
        
        try {
          // TODO: Call getAgoraToken and initialize Agora
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
          // In a real Agora call, the agent's stream would be connected to agentVideoRef
        } catch (error) {
          console.error('Error accessing camera/mic:', error);
          toast({
            variant: 'destructive',
            title: 'Device Access Denied',
            description: 'Please enable camera and microphone permissions.',
          });
          router.back();
        }
      }
    };
    setupCamera();

    return () => {
      // Cleanup: stop media tracks
      if (userVideoRef.current?.srcObject) {
        const stream = userVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user, loading, router, toast]);

  const handleEndCall = () => {
    // TODO: End Agora session
    router.push('/');
  };

  const toggleCamera = () => {
    if(userVideoRef.current?.srcObject){
        const stream = userVideoRef.current.srcObject as MediaStream;
        stream.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
        setIsCameraOn(!isCameraOn);
    }
  }

  const toggleMute = () => {
    if(userVideoRef.current?.srcObject){
        const stream = userVideoRef.current.srcObject as MediaStream;
        stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
        setIsMuted(!isMuted);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dark relative flex h-screen w-full flex-col items-center justify-between bg-black">
      {/* Agent Video (Fullscreen) */}
      <video
        ref={agentVideoRef}
        className="h-full w-full object-cover"
        playsInline
        autoPlay
        muted // Agent video is often muted by default depending on UX
        style={{ backgroundColor: '#222' }} // Placeholder background
      />
      
      {/* User Video (Picture-in-Picture) */}
      <div className="absolute right-4 top-4 h-48 w-32 overflow-hidden rounded-lg border-2 border-secondary">
        <video
          ref={userVideoRef}
          className={cn('h-full w-full object-cover', !isCameraOn && 'hidden')}
          playsInline
          autoPlay
          muted
        />
        {!isCameraOn && (
            <div className="h-full w-full flex items-center justify-center bg-black">
                <VideoOff className="h-8 w-8 text-muted-foreground"/>
            </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6">
        <Button
          variant="secondary"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </Button>
         <Button
          variant="secondary"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
          onClick={toggleCamera}
        >
          {isCameraOn ? <Video size={28} /> : <VideoOff size={28} />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-16 w-16 rounded-full"
          onClick={handleEndCall}
        >
          <PhoneOff size={32} />
        </Button>
      </div>
    </div>
  );
}
