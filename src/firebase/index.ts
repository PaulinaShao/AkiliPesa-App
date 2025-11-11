'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';

// ---- Shared SDK container ----
let app: FirebaseApp;

export function initializeFirebase() {
  // Prevent running in SSR
  if (typeof window === 'undefined') {
    return null;
  }

  // Avoid duplicate initialization
  if (!getApps().length) {
    try {
      // Hosting auto inject config (works only when deployed)
      // @ts-ignore
      app = initializeApp();
    } catch {
      // Local / Firebase Studio
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    functions: getFunctions(app),
    storage: getStorage(app),
  };
}

// Initialize immediately on client
const services = initializeFirebase();

// Export SDKs safely (undefined on server, valid on client)
export const auth = services?.auth!;
export const firestore = services?.firestore!;
export const functions = services?.functions!;
export const storage = services?.storage!;
export const firebaseApp = services?.firebaseApp!;

// Re-exports
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './use-memo-firebase';
export * from './non-blocking-updates';
export { useFirebaseUser } from './auth/use-user';
export * from './provider';
