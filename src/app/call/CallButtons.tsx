'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Video } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseUser } from '@/firebase'; // you already have this

type Props = {
  agentId?: string;
  className?: string;
  labelAudio?: string;
  labelVideo?: string;
};

export default function CallButtons({
  agentId = 'akilipesa-ai',
  className,
  labelAudio = 'Audio',
  labelVideo = 'Video',
}: Props) {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const [loadingType, setLoadingType] = useState<'audio' | 'video' | null>(null);

  const functions = useMemo(() => {
    try {
      return getFunctions();
    } catch {
      return null;
    }
  }, []);

  const startCall = async (mode: 'audio' | 'video') => {
    if (!user || !functions) return;

    try {
      setLoadingType(mode);
      const fn = httpsCallable(functions, 'createCallSession');
      const res: any = await fn({ agentId, mode });
      const { callId, channelName, token, appId, uid } = res.data;

      const params = new URLSearchParams();
      params.set('callId', callId);
      params.set('channelName', channelName);
      params.set('token', token);
      params.set('appId', appId);
      params.set('uid', uid);

      router.push(`/call/${mode}?${params.toString()}`);
    } catch (err) {
      console.error('Failed to start call:', err);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className={className ?? 'flex gap-2'}>
      <button
        type="button"
        onClick={() => startCall('audio')}
        className="inline-flex items-center rounded-lg px-3 py-2 bg-primary text-white hover:opacity-90 transition disabled:opacity-60"
        disabled={!user || loadingType === 'audio'}
      >
        <Phone className="mr-2 h-4 w-4" />{' '}
        {loadingType === 'audio' ? 'Starting…' : labelAudio}
      </button>
      <button
        type="button"
        onClick={() => startCall('video')}
        className="inline-flex items-center rounded-lg px-3 py-2 bg-secondary text-white hover:opacity-90 transition disabled:opacity-60"
        disabled={!user || loadingType === 'video'}
      >
        <Video className="mr-2 h-4 w-4" />{' '}
        {loadingType === 'video' ? 'Starting…' : labelVideo}
      </button>
    </div>
  );
}
