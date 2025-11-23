// functions/src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";
// Initialize the Admin SDK exactly once
const app = getApps().length > 0
    ? getApp()
    : initializeApp();
/**
 * Shared backend handles
 */
export const db = getFirestore(app);
export const storage = getStorage(app);
export { admin };
