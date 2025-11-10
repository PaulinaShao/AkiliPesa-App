'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Phone, Video } from 'lucide-react';

type Props = {
  agentId?: string;
  callId?: string;
  className?: string;
  labelAudio?: string;
  labelVideo?: string;
};

export default function CallButtons({
  agentId = 'akilipesa-ai',
  callId,
  className,
  labelAudio = 'Audio',
  labelVideo = 'Video',
}: Props) {
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set('agentId', agentId);
    if (callId) p.set('callId', callId);
    return p.toString();
  }, [agentId, callId]);

  return (
    <div className={className ?? 'flex gap-2'}>
      <Link
        href={`/call/audio?${qs}`}
        className="inline-flex items-center rounded-lg px-3 py-2 bg-primary text-white hover:opacity-90 transition"
      >
        <Phone className="mr-2 h-4 w-4" /> {labelAudio}
      </Link>
      <Link
        href={`/call/video?${qs}`}
        className="inline-flex items-center rounded-lg px-3 py-2 bg-secondary text-white hover:opacity-90 transition"
      >
        <Video className="mr-2 h-4 w-4" /> {labelVideo}
      </Link>
    </div>
  );
}
