import * as admin from "firebase-admin";

const bucketName = "akilipesacustomize-70486-65934.firebasestorage.app";
const bucketRegion = "us-central1"; // your actual region

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: bucketName,
  });
}

export const db = admin.firestore();
export const storage = admin.storage().bucket(bucketName);
export const region = bucketRegion;
