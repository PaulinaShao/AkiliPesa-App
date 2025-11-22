import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "../firebase.js";

/**
 * One-time initializer to create core Firestore documents.
 * Call from an admin account only.
 */
export const initializeDemoData = onCall(
  { region: "us-central1" },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Sign-in required.");
    }

    const uid = auth.uid;

    // Optional: restrict to a specific admin UID list
    // if (uid !== "<your-admin-uid>") {
    //   throw new HttpsError("permission-denied", "Not allowed.");
    // }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // 1) Platform wallet
    const platformWalletRef = db.collection("wallets").doc("platform");
    await platformWalletRef.set(
      {
        balanceTZS: 0,
        currency: "TZS",
        ownerRole: "platform",
        updatedAt: now,
      },
      { merge: true }
    );

    // 2) Vendor config
    const vendorConfigRef = db.collection("vendorConfig").doc("active");
    await vendorConfigRef.set(
      {
        preferredVendors: {
          text: "openai",
          image: "openai",
          audio: "openai",
          tts: "openai",
          voice_clone: "runpod",
          music: "udio",
          video: "kaiber",
          multi: "openai",
        },
        updatedAt: now,
      },
      { merge: true }
    );

    // 3) Default Akili AI agent
    const agentRef = db.collection("agents").doc("akili-ai");
    await agentRef.set(
      {
        id: "akili-ai",
        ownerUid: uid,
        displayName: "AkiliPesa AI",
        avatarUrl: "",
        persona: "Warm, Tanzanian, supportive assistant.",
        language: "sw",
        feedbackCount: 0,
        jobsCompleted: 0,
        disputes: 0,
        trustScore: 0,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // 4) Sample rewards
    const rewardsCol = db.collection("rewards");
    const rewardDocs = [
      {
        id: "badge-gold",
        name: "Akili Gold Badge",
        description: "Premium badge for loyal creators.",
        costPoints: 1000,
      },
      {
        id: "extra-storage",
        name: "Extra Storage",
        description: "Extra AI media storage for 30 days.",
        costPoints: 1500,
      },
    ];

    for (const r of rewardDocs) {
      await rewardsCol.doc(r.id).set(
        {
          ...r,
          createdAt: now,
        },
        { merge: true }
      );
    }

    // 5) Sample social post
    const postRef = db.collection("posts").doc();
    await postRef.set({
      id: postRef.id,
      authorId: uid,
      text: "Karibu AkiliPesa! 👋 This is your AI-powered social commerce home.",
      mediaUrl: "",
      mediaType: "none",
      published: true,
      likes: 0,
      commentsCount: 0,
      createdAt: now,
      publishedAt: now,
    });

    return { ok: true };
  }
);
