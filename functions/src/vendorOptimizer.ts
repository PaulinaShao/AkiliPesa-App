
import { onCall } from "firebase-functions/v2/https";
import { db } from "./firebase.js";

export const vendorOptimizer = onCall(
  { region: "us-central1" },
  async () => {
    const vendors = [
      { name: "openai", cost: 2 },
      { name: "runpod", cost: 1 },
      { name: "udio", cost: 3 },
    ];

    const cheapest = vendors.sort((a, b) => a.cost - b.cost)[0];

    await db.collection("vendorConfig").doc("active").set(
      {
        vendor: cheapest.name,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return { ok: true, vendor: cheapest.name };
  }
);
