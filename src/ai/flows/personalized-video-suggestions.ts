'use server';

/**
 * @fileOverview This flow provides personalized video suggestions based on the user's watch history.
 *
 * It takes a user's watch history as input and returns a list of suggested video topics.
 * - personalizedVideoSuggestions - A function that suggests video topics based on watch history.
 * - PersonalizedVideoSuggestionsInput - The input type for the personalizedVideoSuggestions function.
 * - PersonalizedVideoSuggestionsOutput - The return type for the personalizedVideoSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedVideoSuggestionsInputSchema = z.object({
  watchHistory: z
    .string()
    .describe('A comma-separated list of video topics the user has watched.'),
});
export type PersonalizedVideoSuggestionsInput = z.infer<
  typeof PersonalizedVideoSuggestionsInputSchema
>;

const PersonalizedVideoSuggestionsOutputSchema = z.object({
  suggestedTopics: z
    .string()
    .describe('A comma-separated list of video topics the user might enjoy.'),
});
export type PersonalizedVideoSuggestionsOutput = z.infer<
  typeof PersonalizedVideoSuggestionsOutputSchema
>;

export async function personalizedVideoSuggestions(
  input: PersonalizedVideoSuggestionsInput
): Promise<PersonalizedVideoSuggestionsOutput> {
  return personalizedVideoSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedVideoSuggestionsPrompt',
  input: {schema: PersonalizedVideoSuggestionsInputSchema},
  output: {schema: PersonalizedVideoSuggestionsOutputSchema},
  prompt: `Based on the user's watch history, suggest some video topics they might enjoy.\n\nUser's Watch History: {{{watchHistory}}}\n\nSuggested Topics:`,
});

const personalizedVideoSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedVideoSuggestionsFlow',
    inputSchema: PersonalizedVideoSuggestionsInputSchema,
    outputSchema: PersonalizedVideoSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
