
// functions/src/ai/adapters/types.ts
export type AiMode =
  | "chat"
  | "image"
  | "tts"
  | "music"
  | "video"
  | "avatar";

export interface AiRequest {
  mode: AiMode;
  prompt: string;
  userId: string;
  extra?: Record<string, any>;
}

export interface AiResponse {
  ok: boolean;
  vendor: string;
  mode: AiMode;
  type: "text" | "image" | "audio" | "video" | "json";
  text?: string;
  imageBase64?: string;
  audioUrl?: string;
  videoUrl?: string;
  raw?: any;
}

export interface AiVendor {
  name: string;
  supports: AiMode[];
  handle(request: AiRequest): Promise<AiResponse>;
}
