'use client';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getDatabase } from "firebase/database";
import { firebaseConfig } from '@/firebase/config';

let app: FirebaseApp | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let firestore: ReturnType<typeof getFirestore> | undefined;
let functions: ReturnType<typeof getFunctions> | undefined;
let storage: ReturnType<typeof getStorage> | undefined;

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return null; // Ensure nothing is initialized on the server
  }

  if (!app) {
    if (getApps().length === 0) {
      try {
        // Hosting-injected config
        // @ts-ignore
        app = initializeApp();
      } catch (e) {
        // Local/Studio development
        app = initializeApp(firebaseConfig);
      }
    } else {
      app = getApp();
    }
    
    // Initialize services once
    auth = getAuth(app);
    firestore = getFirestore(app);
    functions = getFunctions(app);
    storage = getStorage(app);
  }

  return { firebaseApp: app, auth, firestore, functions, storage };
}

// Re-exports for easy access in the app
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './use-memo-firebase';
export * from './non-blocking-updates';
export { useFirebaseUser } from './auth/use-user';
export * from './provider';
