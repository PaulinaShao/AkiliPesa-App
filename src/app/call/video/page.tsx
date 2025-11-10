'use client';
export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';

const VideoUI = nextDynamic(() => import('./ui'), { ssr: false });

export default function VideoPage() {
  return <VideoUI />;
}
