
import fetch from "node-fetch";

const API_BASE = "https://api.runpod.ai/v2/";
const OPENVOICE_ENDPOINT = process.env.OPENVOICE_ENDPOINT_ID || '<YOUR_RUNPOD_OPENVOICE_ENDPOINT>';


function getHeaders() {
  const apiKey = process.env.RUNPOD_API_KEY;
  if (!apiKey) throw new Error("RUNPOD_API_KEY is not set.");
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Transcribes an audio chunk using a RunPod Whisper endpoint.
 * @param audioChunkB64 Base64 encoded audio chunk.
 * @returns The transcribed text or an error.
 */
export async function whisperSTT(audioChunkB64: string): Promise<{ text?: string; error?: string }> {
  const endpointId = process.env.RUNPOD_WHISPER_ENDPOINT_ID;
  if (!endpointId) return { error: "Whisper endpoint ID not configured." };

  try {
    const response = await fetch(`${API_BASE}${endpointId}/run`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        input: {
          audio_format: "pcm16le", // Assuming raw PCM from client
          sample_rate: 16000,
          chunk_b64: audioChunkB64,
        },
      }),
    });

    if (!response.ok) throw new Error(`RunPod STT Error: ${response.status}`);
    const json = await response.json() as any;
    return { text: json.output?.text };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Synthesizes speech using a RunPod OpenVoice endpoint.
 * @param params Parameters for TTS synthesis.
 * @returns Base64 encoded audio or an error.
 */
export async function openVoiceTTS(params: {
  text: string;
  voice_id: string;
  tone: string;
  pace: number;
  energy: number;
  language: string;
}): Promise<{ audio_b64?: string; error?: string }> {
  const endpointId = process.env.RUNPOD_OPENVOICE_ENDPOINT_ID;
  if (!endpointId) return { error: "OpenVoice endpoint ID not configured." };

  try {
    // Note: This is an async job, so we need to create, then poll.
    const createJob = await fetch(`${API_BASE}${endpointId}/run`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ input: { ...params, format: "opus48k" } }),
    });

    const job = await createJob.json() as any;
    if (!job.id) return { error: "Failed to create TTS job." };

    let status = job.status;
    let output: any = null;

    while (status === "IN_PROGRESS" || status === "IN_QUEUE") {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
      const pollResponse = await fetch(`${API_BASE}${endpointId}/status/${job.id}`, { headers: getHeaders() });
      const pollData = await pollResponse.json() as any;
      status = pollData.status;
      output = pollData.output;
      if (status === "FAILED") return { error: "TTS job failed." };
    }
    
    return { audio_b64: output?.audio_b64 };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function synthesizeVoice(text: string, voice: { tone:string; pace:number; energy:number; language:'sw'|'en'|'mix' }) {
  const res = await fetch(`https://api.runpod.ai/v2/${OPENVOICE_ENDPOINT}/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RUNPOD_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        text,
        voice_id: 'akili_base_voice',
        tone: voice.tone,
        pace: voice.pace,
        energy: voice.energy,
        language: voice.language,
        format: 'opus48k'
      }
    })
  });
  const json = await res.json() as any;
  if (!json?.output?.audio_b64) throw new Error('OpenVoice: missing audio_b64');
  return Buffer.from(json.output.audio_b64, 'base64');
}
