
'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

/**
 * Restores a previous AI session from Firestore for the current user.
 * Note: This functionality is largely encapsulated within the `useSessionManager` hook
 * for better integration with the React component lifecycle. This utility
 * function is kept for potential non-hook usage if needed.
 * 
 * @returns The session data if it exists, otherwise null.
 */
export async function restorePreviousSession() {
  const { firestore, user } = useFirebase();

  if (!user || !firestore) return null;

  const ref = doc(firestore, "aiSessions", user.uid);
  const snap = await getDoc(ref);
  
  return snap.exists() ? snap.data() : null;
}
