'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FirebaseProvider, type FirebaseServices } from './provider';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

function initializeFirebase(): FirebaseServices {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
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
