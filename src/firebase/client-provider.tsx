'use client';

import React from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const services = initializeFirebase();

  // The SSR guard ensures that we don't try to render the provider on the server,
  // preventing the hydration mismatch.
  if (!services) {
    return <>{children}</>;
  }

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
