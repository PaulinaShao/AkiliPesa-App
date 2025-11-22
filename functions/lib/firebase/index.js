// functions/src/firebase/index.ts
import * as admin from "firebase-admin";
if (!admin.apps.length) {
    admin.initializeApp();
}
export const db = admin.firestore();
export const storage = admin.storage();
export { admin };
