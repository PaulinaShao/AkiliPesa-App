'use client';

import { useEffect, useState } from 'react';
import {
  type Query,
  type QuerySnapshot,
  type DocumentData,
  onSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * Query that has been created via useFsMemo (or legacy useMemoFirebase).
 * We allow null/undefined so callers can “wait” for Firestore to be ready.
 */
type MemoTaggedQuery =
  | (Query<DocumentData> & { __fsMemo?: boolean; __memo?: boolean })
  | null
  | undefined;

/**
 * Subscribe to a Firestore query in real-time.
 *
 * IMPORTANT:
 *   The Query **must** be memoized using `useFsMemo` (or legacy `useMemoFirebase`)
 *   otherwise it will be recreated every render and cause re-subscriptions.
 */
export function useCollection<T = any>(
  memoizedQuery: MemoTaggedQuery
): UseCollectionResult<T> {
  type StateDataType = WithId<T>[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If caller passes null, treat as “not ready yet”
    if (!memoizedQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));

        setData(docs);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        // We avoid touching private internals like _queryPath – just mark as unknown
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'unknown',
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Bubble up globally so your UI can react
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  // Safety check: ensure the query was actually memoized
  if (
    memoizedQuery &&
    !(memoizedQuery as any).__fsMemo &&
    !(memoizedQuery as any).__memo
  ) {
    throw new Error(
      'The Query passed to useCollection must be memoized with useFsMemo (or legacy useMemoFirebase) to prevent re-renders.'
    );
  }

  return { data, isLoading, error };
}
