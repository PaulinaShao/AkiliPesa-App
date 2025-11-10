
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { IncomingCallWatcher } from '@/components/IncomingCall';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// The services are now initialized inside the component, ensuring it only runs on the client.
const firebaseServices = initializeFirebase();

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      functions={firebaseServices.functions}
    >
      {children}
    </FirebaseProvider>
  );
}
