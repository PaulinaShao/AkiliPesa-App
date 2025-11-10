'use client';
export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';

const AudioUI = nextDynamic(() => import('./ui'), { ssr: false });

export default function AudioPage() {
  return <AudioUI />;
}
