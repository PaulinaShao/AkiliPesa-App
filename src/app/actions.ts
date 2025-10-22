'use server';

import {
  personalizedVideoSuggestions,
} from '@/ai/flows/personalized-video-suggestions';


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
