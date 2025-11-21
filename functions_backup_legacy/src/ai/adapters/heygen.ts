import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.HEYGEN_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with HeyGen's official endpoint when available
    return { error: "HeyGen endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
