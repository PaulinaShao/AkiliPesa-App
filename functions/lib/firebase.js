// src/firebase.ts
// Single source of truth for Firebase Admin in Cloud Functions (Gen 2)
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
// Initialize Admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}
// Shared instances for all backend modules
export const db = getFirestore();
export const storage = getStorage();
export { admin };
