import { VendorPayload, VendorResult } from "./types";

export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.PI_API_KEY;
  if (!key) return { error: "Missing PI_API_KEY" };
  try {
    const fakeUrl = `https://example.com/pi/${p.requestId}.txt`;
    return { outputUrl: fakeUrl };
  } catch (e: any) {
    return { error: e.message };
  }
}
