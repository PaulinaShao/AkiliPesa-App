import { VendorPayload, VendorResult } from "./types";
export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.DEEPMOTION_API_KEY;
  if (!key) return { error: "Missing DEEPMOTION_API_KEY" };
  try {
    const fakeUrl = `https://example.com/deepmotion/${p.requestId}.mp4`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
