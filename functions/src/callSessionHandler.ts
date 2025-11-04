
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const db = admin.firestore();

/**
 * Issues Agora/ZEGOCLOUD tokens for live AI calls and persists session metadata.
 */
export const callSessionHandler = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { channelName, callType } = data;
    if (!channelName || !callType) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing channelName or callType.');
    }

    const uid = context.auth.uid;
    
    // TODO: Implement ZEGOCLOUD token generation if needed. This is for Agora.
    const appId = functions.config().agora.app_id;
    const appCertificate = functions.config().agora.app_certificate;

    if (!appId || !appCertificate) {
        throw new functions.https.HttpsError('failed-precondition', 'Agora credentials are not configured.');
    }
    
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // IMPORTANT: 0 means the user ID will be assigned dynamically by Agora.
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, 0, role, privilegeExpiredTs);

    // Log the call session to Firestore
    const requestRef = db.collection('ai_requests').doc();
    await requestRef.set({
        uid,
        type: 'call',
        input: `Live ${callType} call in channel: ${channelName}`,
        vendor_used: 'agora',
        status: 'success', // Token generation is synchronous
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        token,
        channelName,
        appId,
        request_id: requestRef.id,
    };
});
