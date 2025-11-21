import { VendorPayload, VendorResult } from "./types";

const COOKIE = process.env.SUNO_COOKIE!;
const GRAPHQL = "https://studio-api.suno.ai/api/graphql";

export async function run(p: VendorPayload): Promise<VendorResult> {
  try {
    const prompt = p.input;

    // 1) Create generation task
    const createQuery = {
      query: `
        mutation GenerateSong($prompt: String!, $make_instrumental: Boolean) {
          generateSong(
            prompt: $prompt,
            make_instrumental: $make_instrumental
          ) {
            id
            status
          }
        }
      `,
      variables: {
        prompt,
        make_instrumental: p.options?.instrumental ?? false
      }
    };

    const createRes = await fetch(GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: COOKIE
      },
      body: JSON.stringify(createQuery)
    }).then(r => r.json());

    const id = createRes?.data?.generateSong?.id;
    if (!id) return { error: "SUNO: create failed" };

    // 2) Poll until finished
    let status = createRes.data.generateSong.status;
    let outputUrl: string | null = null;
    let tries = 0;

    while (status !== "completed" && status !== "failed") {
      await new Promise(r => setTimeout(r, 4500));

      const pollQuery = {
        query: `
          query GetSong($id: ID!) {
            song(id: $id) {
              status
              audio_url
            }
          }
        `,
        variables: { id }
      };

      const pollRes = await fetch(GRAPHQL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: COOKIE
        },
        body: JSON.stringify(pollQuery)
      }).then(r => r.json());

      status = pollRes?.data?.song?.status;
      outputUrl = pollRes?.data?.song?.audio_url ?? null;

      if (++tries > 50) break; // ~4min max
    }

    if (!outputUrl || status !== "completed") {
      return { error: "SUNO: no output" };
    }

    return { outputUrl };
  } catch (e: any) {
    return { error: e.message };
  }
}
