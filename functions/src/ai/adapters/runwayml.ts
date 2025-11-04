import { VendorPayload, VendorResult } from "./types";
export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.RUNWAYML_API_KEY;
  if (!key) return { error: "Missing RUNWAYML_API_KEY" };
  try {
    const fakeUrl = `https://example.com/runway/${p.requestId}.mp4`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
