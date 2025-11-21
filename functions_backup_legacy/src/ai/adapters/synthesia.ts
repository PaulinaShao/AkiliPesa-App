import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.SYNTHESIA_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with Synthesia's official endpoint when available
    return { error: "Synthesia endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
