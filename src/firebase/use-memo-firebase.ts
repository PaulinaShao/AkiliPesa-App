'use client';

import { useMemo, type DependencyList } from 'react';
import { useFirebase } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Functions } from 'firebase/functions';

/** Tag added to Firestore refs/queries that are safely memoized */
type FsMemoTag = { __fsMemo: true };

/**
 * useFsMemo
 * Memoize ANY Firestore ref/query you pass in and tag it with __fsMemo so our
 * hooks (useDoc/useCollection) can assert stability.
 */
export function useFsMemo<T extends object | null>(
  factory: () => T,
  deps: DependencyList
): (T & FsMemoTag) | null {
  const value = useMemo(factory, deps);
  if (value && typeof value === 'object') {
    (value as any).__fsMemo = true;
  }
  return value as (T & FsMemoTag) | null;
}

/**
 * Backwards-compat alias so any old imports of useMemoFirebase still work.
 */
export function useMemoFirebase<T extends object | null>(
  factory: () => T,
  deps: DependencyList
): (T & FsMemoTag) | null {
  return useFsMemo(factory, deps);
}

/**
 * useFirebaseReady
 * Returns Firebase services once initialized (client) or null (SSR / not ready yet).
 * Use this when a page needs to wait before rendering.
 */
export interface FirebaseReady {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  functions: Functions;
  user: any;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useFirebaseReady(): FirebaseReady | null {
  const {
    firebaseApp,
    firestore,
    auth,
    functions,
    user,
    isUserLoading,
    userError,
  } = useFirebase();

  const ready = useMemo(() => {
    if (!firebaseApp || !firestore || !auth || !functions) return null;
    return {
      firebaseApp,
      firestore,
      auth,
      functions,
      user,
      isUserLoading,
      userError,
    };
  }, [firebaseApp, firestore, auth, functions, user, isUserLoading, userError]);

  return ready;
}
