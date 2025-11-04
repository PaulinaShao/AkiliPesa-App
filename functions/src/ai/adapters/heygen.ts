import { VendorPayload, VendorResult } from "./types";
export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return { error: "Missing HEYGEN_API_KEY" };
  try {
    const fakeUrl = `https://example.com/heygen/${p.requestId}.mp4`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
