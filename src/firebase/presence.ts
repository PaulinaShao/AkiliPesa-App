
'use client';

import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp } from "firebase/database";
import { useFirebaseUser, useFirebaseApp } from "@/firebase";
import { useEffect } from "react";

export function PresenceWriter() {
  const { user } = useFirebaseUser();
  const app = useFirebaseApp();

  useEffect(() => {
    if (!user || !app) return;

    // Initialize Realtime Database and get a reference to the database service
    const db = getDatabase(app);
    const myStatusRef = ref(db, `/presence/${user.uid}`);

    // Get a reference to the /.info/connected node which is a boolean value that is true when the client is connected and false when they are not.
    const connectedRef = ref(db, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected)! Set up our presence state.
        const con = {
          state: 'online',
          last_changed: serverTimestamp(),
        };
        set(myStatusRef, con);

        // When I disconnect, set my status to 'offline'
        onDisconnect(myStatusRef).set({
          state: 'offline',
          last_changed: serverTimestamp(),
        }).catch((err) => {
            console.error("Could not establish onDisconnect event", err);
        });
      }
    });

    return () => unsubscribe();

  }, [user, app]);

  return null; // This component does not render anything
}
