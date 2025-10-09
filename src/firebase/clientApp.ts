import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBL9J-F5q3OETLAKlZbUeOftw7k0OnqVm8",
  authDomain: "akilipesacustomize-70486-65934.firebaseapp.com",
  projectId: "akilipesacustomize-70486-65934",
  storageBucket: "akilipesacustomize-70486-65934.appspot.com",
  messagingSenderId: "410935694205",
  appId: "1:410935694205:web:292f2629b389532c06f214"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const storage = getStorage(app);
