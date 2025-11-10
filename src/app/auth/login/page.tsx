'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import LoginUI from './ui';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <LoginUI />
    </Suspense>
  );
}
