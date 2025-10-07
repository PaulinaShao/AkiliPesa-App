'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { initializeFirebase } from './config';
import { FirebaseProvider, type FirebaseServices } from './provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // Firebase should only be initialized on the client.
    const firebaseServices = initializeFirebase();
    setServices(firebaseServices);
  }, []);

  if (!services) {
    // You can render a loading state here if needed
    return null;
  }

  return <FirebaseProvider {...services}>{children}</FirebaseProvider>;
}
