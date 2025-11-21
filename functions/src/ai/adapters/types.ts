// functions/src/ai/adapters/types.ts
export type AIMode =
  | "text"
  | "image"
  | "audio"
  | "tts"
  | "voice_clone"
  | "music"
  | "video"
  | "multi";

export type AIResultType = "text" | "image" | "audio" | "video" | "multi";

export interface AIResult {
  vendor: string;
  mode: AIMode | string;
  type: AIResultType;
  text?: string;
  url?: string;      // for hosted media
  base64?: string;   // for inline image/audio
  meta?: any;
}

// This is the old type definition, keeping it for compatibility with some existing files, but new files should use the above.
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
