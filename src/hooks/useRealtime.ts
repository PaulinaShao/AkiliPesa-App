'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";
import { useFirebaseApp } from '@/firebase';

export function useRealtime(path: string) {
  const app = useFirebaseApp();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!app || !path) return;

    const db = getDatabase(app);
    const dataRef = ref(db, path);

    const unsubscribe = onValue(dataRef, (snapshot) => {
      setData(snapshot.val());
    });

    return () => unsubscribe();
  }, [app, path]);

  return data;
}
