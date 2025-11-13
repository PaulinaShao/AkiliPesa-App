'use client';

/**
 * Firebase Root Export Module
 * -----------------------------------------
 * Provides:
 * - Safe initialization (client + SSR)
 * - Global singletons (app, auth, firestore, etc.)
 * - High-level hooks (useFirebase, useFirestore, useAuth, etc.)
 * - Firestore hooks (useDoc, useCollection)
 * - Memo helpers (useFsMemo, useFirebaseReady)
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';
import { firebaseConfig } from './config';

// ---------------------------------------------------------
// Global Firebase Instances (never recreated)
// ---------------------------------------------------------

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions;
let storage: FirebaseStorage;
let database: Database;

/**
 * Safe Firebase initialization (client + SSR)
 * Ensures Firebase is never re-initialized or duplicated.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    try {
      // Firebase Hosting may inject config automatically
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

// Initialize immediately at module load
initializeFirebase();

// ---------------------------------------------------------
// DIRECT EXPORTS (Low-level SDK Access)
// ---------------------------------------------------------
export { app, auth, firestore, functions, storage, database };

// ---------------------------------------------------------
// HIGH-LEVEL HOOKS (Context + Firebase Client Access)
// ---------------------------------------------------------
export * from './provider'; // useFirebase(), useAuth(), useFirestore(), etc.
export * from './client-provider';

// ---------------------------------------------------------
// FIRESTORE HOOKS (Document + Collection)
// ---------------------------------------------------------
export * from './firestore/use-doc';
export * from './firestore/use-collection';

// ---------------------------------------------------------
// MEMO + INITIALIZATION HELPERS
// ---------------------------------------------------------
export * from './use-memo-firebase';   // <-- contains useFsMemo + useFirebaseReady

// ---------------------------------------------------------
// UTILITIES (Optional Files That Exist in Your Project)
// ---------------------------------------------------------
export * from './non-blocking-updates';
export * from './notifications';
export * from './presence';
