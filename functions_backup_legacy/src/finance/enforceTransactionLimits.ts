// functions/src/finance/enforceTransactionLimits.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";

/**
 * Placeholder callable for checking daily/monthly transaction limits.
 * Currently just returns ok:true so it doesn't block anything.
 * You can plug in real logic later.
 */
export const enforceTransactionLimits = onCall(
  { region: "us-central1" },
  async () => {
    // TODO: implement real limits
    return { ok: true };
  }
);
