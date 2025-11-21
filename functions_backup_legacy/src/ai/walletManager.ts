
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

export const walletManager = onDocumentUpdated("wallet/{uid}", async (event) => {
  const after = event.data?.after.data();
  if (!after) return;
  if ((after.balance ?? 0) < 0) {
    await event.data?.after.ref.update({ balance: 0 });
  }
});
