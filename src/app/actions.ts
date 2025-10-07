'use server';

import {
  personalizedVideoSuggestions,
  PersonalizedVideoSuggestionsInput,
} from '@/ai/flows/personalized-video-suggestions';

async function fetchAi<T>(flow: string, input: any): Promise<T> {
  // In a real app, you'd want to use the full URL of your deployed app
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const url = `${baseUrl}/api/ai`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ flow, input }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed with status ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

export async function getSuggestedTopics(watchHistory: string) {
  try {
    const result = await personalizedVideoSuggestions({watchHistory});
    if (result.suggestedTopics) {
      return result.suggestedTopics
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}
