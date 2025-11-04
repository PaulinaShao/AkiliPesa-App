import { VendorPayload, VendorResult } from "./types";
export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.KAIBER_API_KEY;
  if (!key) return { error: "Missing KAIBER_API_KEY" };
  try {
    const fakeUrl = `https://example.com/kaiber/${p.requestId}.mp4`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
