'use client';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function LegacyUserRedirect() {
  // Always route to the canonical profile page
  useEffect(() => {
    redirect('/profile');
  }, []);
  return null;
}
