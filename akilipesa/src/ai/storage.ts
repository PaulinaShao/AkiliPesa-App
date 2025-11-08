
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

const storage = admin.storage();

/**
 * Uploads a raw audio buffer to Firebase Storage
 * Returns: { storagePath, publicUrl, downloadUrl }
 *
 * storagePath = gs://..
 * downloadUrl = https://... (signed)
 */
export async function uploadTTSAudio(
  audioBuffer: Buffer,
  sessionId: string,
  extension: "opus" | "aac" | "wav" = "opus"
) {
  const filename = `${sessionId}/${Date.now()}-${uuidv4()}.${extension}`;
  const bucket = storage.bucket();
  const file = bucket.file(`tts/${filename}`);
  const metadata = {
    contentType:
      extension === "opus"
        ? "audio/ogg"
        : extension === "aac"
        ? "audio/aac"
        : "audio/wav",
  };

  await file.save(audioBuffer, { metadata });

  // Create signed URL valid for 10 minutes
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 10 * 60 * 1000,
  });

  return {
    storagePath: `gs://${bucket.name}/tts/${filename}`,
    publicUrl: `https://storage.googleapis.com/${bucket.name}/tts/${filename}`,
    downloadUrl: url, // ✅ This is the URL the Agora bot will play
  };
}

export async function uploadBufferToStorage(opts: {
  bucketPath: string; // e.g. ai-outputs/{uid}/{sessionId}/tts-{ts}.opus
  buffer: Buffer;
  contentType: string;
}) {
  const bucket = storage.bucket();
  const file = bucket.file(opts.bucketPath);
  await file.save(opts.buffer, {
    resumable: false,
    contentType: opts.contentType,
    metadata: { cacheControl: 'public, max-age=3600' },
  });
  return file;
}

export async function getV4SignedReadUrl(bucketPath: string, expiresMins = 60): Promise<string> {
  const bucket = storage.bucket();
  const file = bucket.file(bucketPath);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresMins * 60 * 1000,
  });
  return url;
}
