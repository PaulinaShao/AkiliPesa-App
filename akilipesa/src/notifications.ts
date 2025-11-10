
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const messaging = admin.messaging();

async function sendNotification(userId: string, payload: admin.messaging.MessagingPayload) {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const tokens = userDoc.data()?.fcmTokens || [];

    if (tokens.length > 0) {
        await messaging.sendToDevice(tokens, payload);
    }
}

export const onBookingRequestCreate = onDocumentCreated("agentBookings/{agentId}/requests/{requestId}", async (event) => {
    const agentId = event.params.agentId;
    const request = event.data?.data();
    if (!request) return;

    const userDoc = await admin.firestore().collection("users").doc(request.userId).get();
    const userName = userDoc.data()?.displayName || "A user";

    await sendNotification(agentId, {
        notification: {
            title: "New Booking Request",
            body: `${userName} has requested a new booking.`,
        },
    });
});

export const onBookingStatusChange = onDocumentUpdated("agentBookings/{agentId}/requests/{requestId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status) return;

    await sendNotification(after.userId, {
        notification: {
            title: "Booking Status Updated",
            body: `Your booking request has been ${after.status}.`,
        },
    });
});

export const onCallInvite = onDocumentCreated("callInvites/{callId}", async (event) => {
    const invite = event.data?.data();
    if (!invite) return;

    await sendNotification(invite.calleeId, {
        notification: {
            title: "Incoming Call",
            body: `${invite.callerName || "Someone"} is calling you.`,
        },
        data: {
            callId: event.params.callId,
            channelName: invite.channelName,
            mode: invite.mode,
        },
    });
});
