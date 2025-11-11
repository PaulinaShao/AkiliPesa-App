'use client';

import React from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const services = initializeFirebase();
  if (!services) return null; // SSR guard

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
      functions={services.functions}
    >
      {children}
    </FirebaseProvider>
  );
}