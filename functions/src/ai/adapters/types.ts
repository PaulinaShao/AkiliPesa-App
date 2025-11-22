//--------------------------------------------------------
// UNIFIED AI TYPES — FINAL VERSION
//--------------------------------------------------------

export type AIResultType = "text" | "image" | "audio" | "video" | "multi";

export interface AIResult {
  type: AIResultType;
  url?: string;
  text?: string;
  buffer?: Buffer;
  vendor?: string;
  mode?: string;     // allow adapters/pipelines to tag the mode
  meta?: any;        // optional extra metadata (e.g. payload info)
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

export interface AiRequest {
  mode: string;      // e.g. "text", "image", "music", "video"
  prompt?: string;
  text?: string;
  audioUrl?: string;
}

export interface AiVendor {
  name: string;
  supports: string[];
  cost: number;

  // Every vendor must implement this
  handle(request: AiRequest): Promise<AiResponse>;
}