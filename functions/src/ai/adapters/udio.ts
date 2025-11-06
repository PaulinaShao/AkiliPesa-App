import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.UDIO_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with Udio's official endpoint when available
    return { error: "Udio endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
