// src/firebase.ts

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// IMPORTANT: admin must be initialized BEFORE using apps.length
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const db = getFirestore();
export const storage = getStorage();
export { admin };
