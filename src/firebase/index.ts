'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';

type Sdks = {
  firebaseApp: FirebaseApp;
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
  functions: ReturnType<typeof getFunctions>;
  storage: ReturnType<typeof getStorage>;
};

export function initializeFirebase(): Sdks {
  // Never run on the server
  if (typeof window === 'undefined') {
    throw new Error('initializeFirebase() called on the server');
  }

  let app: FirebaseApp;
  if (!getApps().length) {
    try {
      // If Hosting injects config, this works:
      // @ts-ignore – empty init allowed on Hosting
      app = initializeApp();
    } catch (_e) {
      // Local/dev/Studio: fall back to explicit config
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

export const { auth, firestore, functions, storage } = initializeFirebase();

// Re-exports you already had
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './use-memo-firebase';
export * from './non-blocking-updates';
export { useFirebaseUser } from './auth/use-user';
export * from './provider';
