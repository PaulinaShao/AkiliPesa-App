//--------------------------------------------------------
// UNIFIED AI TYPES (FIXES AiResponse, AIResult MISMATCH)
//--------------------------------------------------------

export type AIResultType = "text" | "image" | "audio" | "video";

export interface AIResult {
  type: AIResultType;
  url?: string;
  text?: string;
  buffer?: Buffer;
}

export interface AiResponse {
  type: AIResultType;
  url?: string;
  text?: string;
  buffer?: Buffer;
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
