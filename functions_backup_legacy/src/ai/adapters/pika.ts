import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.PIKA_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with Pika's official endpoint when available
    return { error: "Pika endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
