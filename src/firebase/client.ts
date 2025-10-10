'use client';

// src/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBL9J-FsQ30ETLAKlZbUe0ftw7k0OnqVm8",
  authDomain: "akilipesacustomize-70486-65934.firebaseapp.com",
  projectId: "akilipesacustomize-70486-65934",
  storageBucket: "akilipesacustomize-70486-65934.appspot.com",
  messagingSenderId: "419035694205",
  appId: "1:419035694205:web:292f2629b38532c06f214"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, doc, setDoc, getDoc };