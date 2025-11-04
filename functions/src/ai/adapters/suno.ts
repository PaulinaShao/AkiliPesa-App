import { VendorPayload, VendorResult } from "./types";
export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.SUNO_API_KEY;
  if (!key) return { error: "Missing SUNO_API_KEY" };
  try {
    const fakeUrl = `https://example.com/suno/${p.requestId}.mp3`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
