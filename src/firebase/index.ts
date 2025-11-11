'use client';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getDatabase } from "firebase/database";
import { firebaseConfig } from '@/firebase/config';

let app: FirebaseApp | undefined;

export function initializeFirebase() {
  if (typeof window === 'undefined') return null; // never run during SSR

  if (!app) {
    if (!getApps().length) {
      try {
        // Hosting injects config at runtime
        // @ts-ignore
        app = initializeApp();
      } catch {
        app = initializeApp(firebaseConfig); // Studio/Local
      }
    } else {
      app = getApp();
    }
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    functions: getFunctions(app),
    storage: getStorage(app),
  };
}

// OPTIONAL: export lazy getters if you want
export const services = initializeFirebase();

export const auth = services?.auth!;
export const firestore = services?.firestore!;
export const functions = services?.functions!;
export const storage = services?.storage!;
export const firebaseApp = services?.firebaseApp!;
export const database = services ? getDatabase(services.firebaseApp) : undefined;

// Re-exports (unchanged)
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './use-memo-firebase';
export * from './non-blocking-updates';
export { useFirebaseUser } from './auth/use-user';
export * from './provider';