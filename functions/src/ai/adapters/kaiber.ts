import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.KAIBER_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with Kaiber's official endpoint when available
    return { error: "Kaiber endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
