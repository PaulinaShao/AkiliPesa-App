'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

interface CollectionState<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

export function useCollection<T>(query: Query<DocumentData> | null) {
  const firestore = useFirestore();
  const [state, setState] = useState<CollectionState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!firestore || !query) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prevState => ({ ...prevState, loading: true }));

    const unsubscribe = onSnapshot(
      query,
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setState({ data, loading: false, error: null });
      },
      error => {
        console.error('Error fetching collection:', error);
        setState({ data: null, loading: false, error });
      }
    );

    return () => unsubscribe();
  }, [firestore, query]);

  return state;
}
