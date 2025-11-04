import { VendorPayload, VendorResult } from "./types";

export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.RUNPOD_API_KEY;
  if (!key) return { error: "Missing RUNPOD_API_KEY" };
  try {
    const fakeUrl = `https://example.com/runpod/${p.requestId}.wav`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
