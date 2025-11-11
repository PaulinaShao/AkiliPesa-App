'use client';
export const dynamic = 'force-dynamic';

import { dynamicPick } from '@/lib/dynamic-safe';

const AudioUI = dynamicPick(() => import('./ui'));

export default function AudioPage() {
  return <AudioUI />;
}
