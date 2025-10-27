
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

/**
 * Triggered when a new voice file is uploaded to Firebase Storage.
 * It forwards the voice file to your OpenVoice / RunPod Hugging Face Space for cloning.
 */
export const onVoiceUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    try {
      const filePath = object.name; // e.g., voices/{uid}/{fileName}
      if (!filePath || !filePath.startsWith("voices/")) {
        console.log(`File path "${filePath}" is not a voice file. Skipping.`);
        return null;
      }

      const parts = filePath.split("/");
      if (parts.length < 3) {
        console.log(`Invalid voice file path format: "${filePath}". Skipping.`);
        return null;
      }
      const uid = parts[1];

      const bucket = admin.storage().bucket(object.bucket);
      const [url] = await bucket.file(filePath).getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15-minute expiry
      });

      // IMPORTANT: Set this environment variable in your Firebase project
      // firebase functions:config:set openvoice.url="https://your-hf-space-or-runpod-url"
      const cloneEndpoint = functions.config().openvoice?.url || process.env.OPENVOICE_URL;
      
      if (!cloneEndpoint) {
          console.error("❌ OpenVoice endpoint URL is not configured. Set OPENVOICE_URL environment variable or Firebase config.");
          return null;
      }

      console.log(`Forwarding voice sample for user ${uid} to ${cloneEndpoint}`);

      // Send to Hugging Face Space or RunPod endpoint
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenVoice API returned ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();

      // Update the corresponding clone document in Firestore
      const cloneDocRef = admin.firestore().collection("users").doc(uid)
        .collection("clones").doc(`clone_${uid.substring(0, 5)}`);

      await cloneDocRef.set(
          {
            cloneStatus: "ready",
            voiceCloneUrl: data.output || null, // URL of the generated voice model
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      console.log(`✅ Voice clone processed successfully for user ${uid}. voiceCloneUrl set to: ${data.output}`);
      return null;

    } catch (error) {
      console.error("❌ onVoiceUpload function failed:", error);
      // Optional: Update Firestore to indicate a failure
      const filePath = object.name;
      if (filePath && filePath.startsWith("voices/")) {
          const uid = filePath.split("/")[1];
          const cloneDocRef = admin.firestore().collection("users").doc(uid)
            .collection("clones").doc(`clone_${uid.substring(0, 5)}`);
          await cloneDocRef.set({ cloneStatus: "failed", error: (error as Error).message }, { merge: true });
      }
      return null;
    }
  });
