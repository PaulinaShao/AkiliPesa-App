'use client';

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from '@/firebase/config';

// --- Global singletons ------------------------------------------------------

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions;
let storage: FirebaseStorage;
let database: Database;

/**
 * Initializes Firebase app & services safely (client + SSR).
 * Ensures we never re-initialize during hot reload or multiple imports.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    try {
      // On Firebase Hosting, config can be injected automatically
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
  functions = getFunctions(app, 'us-central1');
  storage = getStorage(app);
  database = getDatabase(app);

  return { app, auth, firestore, functions, storage, database };
}

// Initialize immediately for app-wide usage
initializeFirebase();

// --- Direct named exports (for low-level access if needed) -------------------

export { app, auth, firestore, functions, storage, database };

// --- High-level hooks & utilities -------------------------------------------

// Context provider + hooks (useFirebase, useAuth, useFirestore, useFirebaseUser, etc.)
export * from './provider';

// Optional: client-side wrapper (if you use FirebaseClientProvider somewhere)
export * from './client-provider';

// Firestore hooks
export * from './firestore/use-doc';
export * from './firestore/use-collection';

// Memo helper + "ready" helper (useFsMemo, useMemoFirebase, useFirebaseReady)
export * from './use-memo-firebase';

// Optional util you already had
export * from './non-blocking-updates';
