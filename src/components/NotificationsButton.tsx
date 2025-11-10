'use client';

import { useFirebase, useFirebaseUser } from "@/firebase";
import { enableWebPushAndSaveToken } from "@/firebase/notifications";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";

export function NotificationsButton() {
    const { firebaseApp, firestore } = useFirebase();
    const { user } = useFirebaseUser();

    const handleEnableNotifications = () => {
        if (firebaseApp && firestore && user) {
            enableWebPushAndSaveToken(firebaseApp, firestore, user);
        } else {
            console.error("Firebase services not ready or user not logged in.");
        }
    };
    
    if (!user) return null;

    return (
        <div className="fixed bottom-20 right-4 z-50">
            <Button onClick={handleEnableNotifications} size="sm" variant="outline">
                <Bell className="mr-2 h-4 w-4" /> Enable Notifications
            </Button>
        </div>
    );
}
