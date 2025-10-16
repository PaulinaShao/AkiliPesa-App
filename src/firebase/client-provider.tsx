
'use client';

import React, { type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { initUserSession } from '@/firebase/auth/on-auth-state-changed';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

const firebaseServices = initializeFirebase();

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  useEffect(() => {
    // Initializes the smart user session handler on app startup.
    initUserSession(firebaseServices.auth, firebaseServices.firestore);
  }, []);

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
