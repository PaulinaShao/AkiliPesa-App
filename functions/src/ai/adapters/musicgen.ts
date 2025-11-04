import { VendorPayload, VendorResult } from "./types";
export async function run(p: VendorPayload): Promise<VendorResult> {
  const url = process.env.MUSICGEN_API_URL; // your hosted inference
  if (!url) return { error: "Missing MUSICGEN_API_URL" };
  try {
    const fakeUrl = `https://example.com/musicgen/${p.requestId}.mp3`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
