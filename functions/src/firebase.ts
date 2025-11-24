// functions/src/firebase.ts
import * as admin from "firebase-admin";

// --------------------------------------------
// GEN-2 FRIENDLY ADMIN INITIALIZATION
// --------------------------------------------
if (!admin.apps.length) {
  // No custom options: use default project + default bucket
  admin.initializeApp();
}

export const db = admin.firestore();
export const storage = admin.storage();

export { admin };
