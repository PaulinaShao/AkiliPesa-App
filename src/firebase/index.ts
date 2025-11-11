'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';

let app: FirebaseApp | undefined;

export type FirebaseServices = {
  firebaseApp: FirebaseApp;
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
  functions: ReturnType<typeof getFunctions>;
  storage: ReturnType<typeof getStorage>;
};

export function initializeFirebase(): FirebaseServices | null {
  // Never run on the server
  if (typeof window === 'undefined') return null;

  if (!getApps().length) {
    // Try Hosting-injected config first (prod), fall back to local config
    try {
      // @ts-ignore Firebase Hosting can inject config with no args
      app = initializeApp();
    } catch {
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  return {
    firebaseApp: app!,
    auth: getAuth(app!),
    firestore: getFirestore(app!),
    functions: getFunctions(app!),
    storage: getStorage(app!),
  };
}

// DO NOT re-export client-provider from here (prevents circular import)

// Safe convenience exports (undefined on server, valid on client)
const services = typeof window !== 'undefined' ? initializeFirebase() : null;
export const firebaseApp = services?.firebaseApp;
export const auth = services?.auth;
export const firestore = services?.firestore;
export const functions = services?.functions;
export const storage = services?.storage;

// Other re-exports that do NOT import back from '@/firebase'
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './use-memo-firebase';
export * from './non-blocking-updates';
export { useFirebaseUser } from './auth/use-user';
export * from './provider';
