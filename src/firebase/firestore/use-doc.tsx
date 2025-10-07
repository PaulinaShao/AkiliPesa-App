'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

interface DocState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useDoc<T>(ref: DocumentReference<DocumentData> | null) {
  const firestore = useFirestore();
  const [state, setState] = useState<DocState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!firestore || !ref) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prevState => ({ ...prevState, loading: true }));

    const unsubscribe = onSnapshot(
      ref,
      snapshot => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as T;
          setState({ data, loading: false, error: null });
        } else {
          setState({ data: null, loading: false, error: null });
        }
      },
      error => {
        console.error('Error fetching document:', error);
        setState({ data: null, loading: false, error });
      }
    );

    return () => unsubscribe();
  }, [firestore, ref]);

  return state;
}
