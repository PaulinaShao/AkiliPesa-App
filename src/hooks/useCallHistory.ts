
'use client';

import { useFirebaseUser, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";

export function useCallHistory() {
  const { user } = useFirebaseUser();
  const firestore = useFirestore();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !firestore) return;
    const ref = collection(firestore, "callHistory");
    const q = query(ref, where("participants", "array-contains", user.uid), orderBy("startedAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, [user, firestore]);

  return history;
}
