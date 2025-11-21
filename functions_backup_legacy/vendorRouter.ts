
export function pickVendors(intent: string, tier: 'standard'|'premium') {
  // Extremely simple routing stub
  const map: Record<string, string> = {
    'voice-chat': tier === 'premium' ? 'openai-gpt-4o-realtime' : 'openvoice',
    'video-teach': tier === 'premium' ? 'openai-vision+runpod-avatar' : 'runpod-avatar',
    'music': 'openai-audio',
    'movie': 'runwayml',
    'design': 'sdxl',
    'document': 'gpt-4o'
  };
  return (map as any)[intent] ?? 'gpt-4o';
}
