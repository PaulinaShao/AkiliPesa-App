'use client';

import { useState, useEffect } from 'react';
import {
  type DocumentReference,
  onSnapshot,
  type DocumentData,
  type FirestoreError,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

type MemoTaggedDocRef =
  | (DocumentReference<DocumentData> & { __fsMemo?: boolean; __memo?: boolean })
  | null
  | undefined;

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 *
 * IMPORTANT:
 *   The DocumentReference MUST be memoized using useFsMemo (or the legacy
 *   useMemoFirebase) so React doesn't recreate it on every render.
 */
export function useDoc<T = any>(
  memoizedDocRef: MemoTaggedDocRef
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  // Safety check: ensure source was memoized
  if (
    memoizedDocRef &&
    !(memoizedDocRef as any).__fsMemo &&
    !(memoizedDocRef as any).__memo
  ) {
    throw new Error(
      'The DocumentReference passed to useDoc must be memoized with useFsMemo (or legacy useMemoFirebase) to prevent re-renders.'
    );
  }

  return { data, isLoading, error };
}
