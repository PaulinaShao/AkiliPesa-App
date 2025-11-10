'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import PhoneUI from './ui';

export default function PhonePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PhoneUI />
    </Suspense>
  );
}
