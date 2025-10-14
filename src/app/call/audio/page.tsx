'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { AgentPicker } from '@/components/AgentPicker';
import { doc, getDoc } from 'firebase/firestore';

function AudioCallComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [showPicker, setShowPicker] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [callDetails, setCallDetails] = useState<any>(null);
  const [pricePerSec, setPricePerSec] = useState(0);
  const [tzsPerCredit, setTzsPerCredit] = useState(100);
  const [callDuration, setCallDuration] = useState(0);

  const agentId = searchParams.get('agentId');
  const agentType = searchParams.get('agentType');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'Connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchAgentAndStartCall = async (id: string, type: string) => {
      let agentDocRef;
      if (type === 'admin') {
        agentDocRef = doc(firestore, 'adminAgents', id);
      } else {
        // This is a simplification. Finding a user agent requires knowing the owner.
        // For now we assume we can't call user agents yet.
        console.error("User agent calling not fully implemented in UI.");
        setCallStatus('Call Failed: User agents not callable yet.');
        return;
      }
      
      const agentSnap = await getDoc(agentDocRef);
      if (agentSnap.exists()) {
        const agentData = agentSnap.data();
        setAgent(agentData);
        setPricePerSec(agentData.pricePerSecondCredits);
        
        const settingsRef = doc(firestore, 'adminSettings', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
            setTzsPerCredit(settingsSnap.data().pricing.tzsPerCredit);
        }

        // Initialize Call
        const functions = getFunctions();
        const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
        try {
          setCallStatus('Initializing...');
          const result: any = await getAgoraToken({ agentId: id, agentType: type, mode: 'audio' });
          setCallDetails(result.data);
          // TODO: Initialize Agora with result.data.token and result.data.channelName
          setCallStatus('Connected'); // Mock: "Connected"
        } catch (e: any) {
          console.error("Error getting Agora token:", e);
          setCallStatus(`Call Failed: ${e.message}`);
        }

      } else {
        console.error("Agent not found");
        setCallStatus("Agent not found");
      }
    };

    if (agentId && agentType) {
      fetchAgentAndStartCall(agentId, agentType);
    } else {
      setShowPicker(true);
    }
  }, [user, isUserLoading, router, agentId, agentType, firestore]);

  const handleAgentSelect = (selectedAgent: { id: string, type: 'admin' | 'user' }) => {
    setShowPicker(false);
    router.push(`/call/audio?agentId=${selectedAgent.id}&agentType=${selectedAgent.type}`);
  };

  const handleEndCall = async () => {
    if (callDetails?.callId) {
        const functions = getFunctions();
        const endCall = httpsCallable(functions, 'endCall');
        try {
            await endCall({ callId: callDetails.callId, seconds: callDuration });
        } catch (e) {
            console.error("Error ending call:", e);
        }
    }
    // TODO: End Agora session properly
    router.push('/');
  };

  if (isUserLoading || (!agent && !showPicker)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark">
        <p>Loading...</p>
      </div>
    );
  }

  if (showPicker) {
    return <AgentPicker show={true} onSelect={handleAgentSelect} onCancel={() => router.back()} />
  }

  return (
    <div className="dark flex h-screen w-full flex-col items-center justify-between bg-background p-8">
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        {agent ? (
            <>
                <UserAvatar src={agent.avatarUrl} username={agent.name} className="h-32 w-32 border-4 border-primary" />
                <h1 className="text-3xl font-bold">{agent.name}</h1>
            </>
        ) : (
            <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary"></div>
        )}
        <p className="text-lg text-muted-foreground">{callStatus}</p>
        <p className="text-sm text-accent">
            {pricePerSec > 0 && `~TZS ${(pricePerSec * tzsPerCredit).toFixed(2)}/sec`}
        </p>
         <p className="text-lg text-muted-foreground">{new Date(callDuration * 1000).toISOString().substr(14, 5)}</p>
      </div>

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

export default function AudioCallPage() {
    return (
        <Suspense fallback={<div className="dark flex h-screen w-full items-center justify-center bg-background"><p>Loading...</p></div>}>
            <AudioCallComponent />
        </Suspense>
    )
}
