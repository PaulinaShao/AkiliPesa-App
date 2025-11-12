'use client';

import { useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Functions } from 'firebase/functions';

/**
 * useMemoFirebase()
 * - Provides stable, memoized Firebase context references
 * - Prevents [object Object] hydration mismatch in Next.js
 * - Ensures services are only returned once fully initialized
 */

export interface MemoizedFirebase {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  functions: Functions | null;
  user: any;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useMemoFirebase(): MemoizedFirebase | null {
  const {
    firebaseApp,
    firestore,
    auth,
    functions,
    user,
    isUserLoading,
    userError,
  } = useFirebase();

  // ✅ Return null until Firebase is ready
  const memoized = useMemo(() => {
    if (!firebaseApp || !firestore || !auth || !functions) {
      return null;
    }

    return {
      firebaseApp,
      firestore,
      auth,
      functions,
      user,
      isUserLoading,
      userError,
    };
  }, [
    firebaseApp,
    firestore,
    auth,
    functions,
    user,
    isUserLoading,
    userError,
  ]);

  return memoized;
}
