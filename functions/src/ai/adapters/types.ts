// functions/src/ai/adapters/types.ts
//--------------------------------------------------------
// UNIFIED AI TYPES — FINAL CLEAN VERSION
//--------------------------------------------------------

export type AIResultType = "text" | "image" | "audio" | "video" | "multi";

export interface AIResult {
  type: AIResultType;
  url?: string;
  text?: string;
  buffer?: Buffer;
  vendor?: string;
  mode?: string;
  meta?: any;
}

export interface AiResponse {
  type: AIResultType;
  url?: string;
  text?: string;
  buffer?: Buffer;
  vendor?: string;
  mode?: string;
  meta?: any;
}

export interface AiVendor {
  name: string;
  supports: string[];
  cost: number;

  handle(request: AiRequest): Promise<AiResponse>;
}

// --------------------------------------------------------
// SINGLE, FINAL AiRequest INTERFACE
// --------------------------------------------------------

export interface AiRequest {
  // e.g. "chat", "image", "tts", "music", "video", "voice_clone"
  mode: string;

  // main prompt text (always present for now)
  prompt: string;

  // who is paying / owning this generation
  userId: string;

  // free-form metadata (can contain anything: persona, jobId, etc.)
  extra: Record<string, any>;

  // optional fields used by specific pipelines
  text?: string;
  audioUrl?: string;
}
