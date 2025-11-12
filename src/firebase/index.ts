'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from '@/firebase/config';

// --- Global singletons ---
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions;
let storage: FirebaseStorage;
let database: Database;

/**
 * Initializes Firebase app & services safely (client + server).
 * Ensures it never re-initializes during hot reload or SSR.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    try {
      // On Firebase Hosting, use injected config if available
      // @ts-ignore
      app = initializeApp();
    } catch {
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  firestore = getFirestore(app);
  functions = getFunctions(app, 'us-central1'); // Set default region
  storage = getStorage(app);
  database = getDatabase(app);

  return { app, auth, firestore, functions, storage, database };
}

// Initialize immediately for app-wide usage
initializeFirebase();

// --- Direct named exports (fixes “auth not exported” errors) ---
export { app, auth, firestore, functions, storage, database };

// --- Re-exports for hooks and utilities ---
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './use-memo-firebase';
export * from './non-blocking-updates';
export { useFirebaseUser } from './auth/use-user';
export * from './provider';
