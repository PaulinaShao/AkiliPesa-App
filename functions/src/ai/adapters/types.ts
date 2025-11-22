//--------------------------------------------------------
// UNIFIED AI TYPES — FIXED to include vendor + multi mode
//--------------------------------------------------------

export type AIResultType = "text" | "image" | "audio" | "video" | "multi";

export interface AIResult {
  type: AIResultType;
  url?: string;
  text?: string;
  buffer?: Buffer;
  vendor?: string;   // FIX #1
}

export interface AiResponse {
  type: AIResultType;
  url?: string;
  text?: string;
  buffer?: Buffer;
  vendor?: string;   // FIX #1
}

export interface AiRequest {
  mode: string;
  prompt?: string;
  text?: string;
  audioUrl?: string;
}

export interface AiVendor {
  name: string;
  supports: string[];
  cost: number;

  // REQUIRED
  handle(request: AiRequest): Promise<AiResponse>;
}
