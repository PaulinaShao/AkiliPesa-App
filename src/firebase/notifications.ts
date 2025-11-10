
'use client';

import { getMessaging, getToken } from "firebase/messaging";
import { useFirebase, useFirebaseUser } from "@/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export async function enableWebPushAndSaveToken() {
    const { firebaseApp, firestore, user } = useFirebase();
    if (!firebaseApp || !firestore || !user) {
        console.error("Firebase not initialized or user not logged in.");
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const messaging = getMessaging(firebaseApp);
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
            });

            if (currentToken) {
                const userRef = doc(firestore, "users", user.uid);
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(currentToken),
                });
                console.log("FCM token saved:", currentToken);
            } else {
                console.log("No registration token available. Request permission to generate one.");
            }
        } else {
            console.log("Unable to get permission to notify.");
        }
    } catch (error) {
        console.error("An error occurred while enabling notifications.", error);
    }
}
