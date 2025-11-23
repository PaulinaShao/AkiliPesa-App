// firebase.ts — single source of truth (TypeScript)
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
if (!admin.apps.length) {
    admin.initializeApp();
}
export const db = getFirestore();
export const storage = getStorage();
export { admin };
