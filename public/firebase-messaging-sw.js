
// This service worker can be customized to show notifications
// when the app is in the background.

// For now, it just initializes Firebase messaging.
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// TODO: Replace with your app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBL9J-F5q3OETLAKlZbUeOftw7k0OnqVm8",
  authDomain: "akilipesacustomize-70486-65934.firebaseapp.com",
  projectId: "akilipesacustomize-70486-65934",
  storageBucket: "akilipesacustomize-70486-65934.appspot.com",
  messagingSenderId: "410935694205",
  appId: "1:410935694205:web:292f2629b389532c06f214"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
