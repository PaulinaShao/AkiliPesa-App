
'use client';

import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp } from "firebase/database";
import { useFirebaseUser, useFirebaseApp } from "@/firebase";
import { useEffect } from "react";

export function usePresence() {
  const { user } = useFirebaseUser();
  const app = useFirebaseApp();

  useEffect(() => {
    if (!user || !app) return;

    const db = getDatabase(app);
    const myStatusRef = ref(db, 'status/' + user.uid);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        const con = {
          state: 'online',
          last_changed: serverTimestamp(),
        };
        set(myStatusRef, con);

        onDisconnect(myStatusRef).set({
          state: 'offline',
          last_changed: serverTimestamp(),
        }).catch((err) => {
            console.error("Could not establish onDisconnect event", err);
        });
      }
    });

  }, [user, app]);
}
