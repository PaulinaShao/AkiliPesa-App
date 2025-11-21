import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Triggered when a new voice file is uploaded and forwards to OpenVoice.
 */
export const onVoiceUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    try {
      const filePath = object.name;
      if (!filePath || !filePath.startsWith("voices/")) return null;

      const uid = filePath.split("/")[1];
      const bucket = admin.storage().bucket(object.bucket);
      const [url] = await bucket.file(filePath).getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000,
      });

      const cloneEndpoint = functions.config().openvoice?.url || process.env.OPENVOICE_URL;
      if (!cloneEndpoint) {
        console.error("❌ Missing OPENVOICE_URL");
        return null;
      }

      console.log(`Forwarding voice for ${uid} → ${cloneEndpoint}`);

      // ✅ Built-in fetch works now
      const response = await fetch(cloneEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          audioUrl: url,
          model: "myshell-ai/openvoice",
          outputName: `clone_${uid}`,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      const data: any = await response.json();

      await admin.firestore()
        .collection("users")
        .doc(uid)
        .collection("clones")
        .doc(`clone_${uid.substring(0, 5)}`)
        .set({
          cloneStatus: "ready",
          voiceCloneUrl: data.output || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

      console.log(`✅ Voice clone completed for ${uid}`);
      return null;

    } catch (error) {
      console.error("❌ onVoiceUpload failed:", error);
      return null;
    }
  });
