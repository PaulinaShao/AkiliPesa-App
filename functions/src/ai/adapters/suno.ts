import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.SUNO_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with Suno's official endpoint when available
    return { error: "Suno endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
