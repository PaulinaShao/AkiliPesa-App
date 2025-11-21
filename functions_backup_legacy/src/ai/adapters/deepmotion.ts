import { VendorPayload, VendorResult } from "./types";
const KEY = process.env.DEEPMOTION_API_KEY!;
export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    // Replace with DeepMotion's official endpoint when available
    return { error: "DeepMotion endpoint not configured. Add API call here." };
  } catch (e:any) { return { error: e.message }; }
}
