import { VendorPayload, VendorResult } from "./types";

export async function run(p: VendorPayload): Promise<VendorResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { error: "Missing ELEVENLABS_API_KEY" };
  try {
    const fakeUrl = `https://example.com/elevenlabs/${p.requestId}.mp3`;
    return { outputUrl: fakeUrl };
  } catch (e:any) {
    return { error: e.message };
  }
}
