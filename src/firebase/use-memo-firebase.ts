'use client';

import { useMemo, type DependencyList } from 'react';
import { useFirebase } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore, Query, DocumentData, DocumentReference } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Functions } from 'firebase/functions';

/** Tag added to Firestore refs/queries that are safely memoized */
type FsMemoTag = { __fsMemo: true };

/**
 * useFsMemo
 *
 * Memoize ANY Firestore ref/query you pass in and tag it with __fsMemo so our
 * hooks (useDoc/useCollection) can assert stability.
 *
 * Example:
 *   const userDoc = useFsMemo(
 *     () => (user ? doc(firestore, 'users', user.uid) : null),
 *     [firestore, user?.uid]
 *   );
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
 * useFirebaseReady
 *
 * Returns Firebase services once initialized on the client.
 * Returns null on SSR or before initialization.
 *
 * Use this when a page needs to “wait” before it can safely call Firestore.
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

  const ready = useMemo<FirebaseReady | null>(() => {
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
