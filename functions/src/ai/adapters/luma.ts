import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.LUMA_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with Luma's official endpoint when available
    return { error: "Luma endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
