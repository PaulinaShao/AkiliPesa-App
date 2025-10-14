
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Initialize Firebase ONCE on the client side when this module is first loaded.
const firebaseServices = initializeFirebase();

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The firebaseServices object is now stable and won't be re-created on renders.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
