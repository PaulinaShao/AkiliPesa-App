
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

const storage = admin.storage();

function formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export const onBookingStatusCreateIcs = onDocumentUpdated("agentBookings/{agentId}/requests/{reqId}", async (event) => {
    if (!event.data) return;

    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === 'approved' || after.status !== 'approved') {
        return;
    }

    const { start, end, userId } = after;
    const agentId = event.params.agentId;
    const reqId = event.params.reqId;

    const startTime = (start as admin.firestore.Timestamp).toDate();
    const endTime = (end as admin.firestore.Timestamp).toDate();
    
    const userSnap = await admin.firestore().collection("users").doc(userId).get();
    const agentSnap = await admin.firestore().collection("users").doc(agentId).get();
    const userEmail = userSnap.data()?.email || "user@example.com";
    const agentEmail = agentSnap.data()?.email || "agent@example.com";

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AkiliPesa//Booking//EN",
        "BEGIN:VEVENT",
        `UID:${uuidv4()}`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(startTime)}`,
        `DTEND:${formatICSDate(endTime)}`,
        `SUMMARY:Booking with ${agentSnap.data()?.displayName || agentId}`,
        `DESCRIPTION:Your confirmed booking session on AkiliPesa.`,
        `ORGANIZER;CN=${agentSnap.data()?.displayName}:mailto:${agentEmail}`,
        `ATTENDEE;CN=${userSnap.data()?.displayName};ROLE=REQ-PARTICIPANT:mailto:${userEmail}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const bucket = storage.bucket();
    const filePath = `bookings/${agentId}/${reqId}.ics`;
    const file = bucket.file(filePath);
    
    await file.save(icsContent, { contentType: "text/calendar" });

    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await event.data.after.ref.set({ icsUrl: signedUrl }, { merge: true });

    // Send FCM notification (code from notifications.ts could be reused/refactored)
     const userDoc = await admin.firestore().collection("users").doc(userId).get();
     const tokens = userDoc.data()?.fcmTokens || [];
 
     if (tokens.length > 0) {
         await admin.messaging().sendToDevice(tokens, {
             notification: {
                 title: "Booking Confirmed!",
                 body: `Your booking with ${agentSnap.data()?.displayName} is confirmed.`,
             },
             data: {
                 icsUrl: signedUrl,
                 type: "booking_confirmed"
             }
         });
     }
});
