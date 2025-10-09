
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { users } from '@/lib/data'; // Using mock data for agent

export default function AudioCallPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');

  // Mock agent data
  const agent = users.find(u => u.id === 'u2');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      // TODO: Check wallet balance
      // const userProfile = await getUserProfile(user.uid);
      // if (userProfile.wallet.balance <= 0) {
      //   router.push('/wallet?recharge=true');
      //   return;
      // }
      
      // TODO: Call getAgoraToken Firebase Function and initialize call
      setCallStatus('Ringing...');
      
      // Simulate call connection
      const timer = setTimeout(() => setCallStatus('00:01'), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  const handleEndCall = () => {
    // TODO: End Agora session
    router.push('/');
  };

  if (loading || !user || !agent) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dark flex h-screen w-full flex-col items-center justify-between bg-background p-8">
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <UserAvatar src={agent.avatar} username={agent.username} className="h-32 w-32 border-4 border-primary" />
        <h1 className="text-3xl font-bold">{agent.name}</h1>
        <p className="text-lg text-muted-foreground">{callStatus}</p>
      </div>

      {/* Placeholder for waveform */}
      <div className="w-full max-w-sm h-24 flex items-center justify-center">
        <p className="text-muted-foreground">(Waveform placeholder)</p>
      </div>

      <div className="flex items-center justify-center gap-6">
        <Button
          variant="secondary"
          size="icon"
          className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-20 w-20 rounded-full"
          onClick={handleEndCall}
        >
          <PhoneOff size={40} />
        </Button>
      </div>
    </div>
  );
}
