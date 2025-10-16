
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This is a separate initialization for server-side usage (e.g., in Server Components)
// It ensures we don't create multiple app instances.

let firebaseApp: FirebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const firestore = getFirestore(firebaseApp);

export function initializeFirebase() {
    return { firebaseApp, firestore };
}
