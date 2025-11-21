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

type MemoTaggedQuery =
  | (Query<DocumentData> & { __fsMemo?: boolean; __memo?: boolean })
  | null
  | undefined;

/**
 * React hook to subscribe to a Firestore query in real time.
 *
 * IMPORTANT:
 *   The Query MUST be memoized using useFsMemo (or legacy useMemoFirebase),
 *   otherwise React will recreate it every render and cause re-subscriptions.
 */
export function useCollection<T = any>(
  memoizedQuery: MemoTaggedQuery
): UseCollectionResult<T> {
  type StateDataType = WithId<T>[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
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
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path:
            // @ts-expect-error internal path
            memoizedQuery._queryPath?.toString?.() ?? 'unknown',
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  // Safety check: ensure the query was memoized
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
