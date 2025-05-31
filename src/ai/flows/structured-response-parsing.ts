
// This is an automatically generated file.
'use server';

/**
 * @fileOverview Parses structured incident data from Gemini's response.
 * Scene context is not used here as it's expected to be inferred by the primary detection model.
 *
 * - parseGeminiResponse - Parses the response from Gemini to extract incident details.
 * - ParseGeminiResponseInput - The input type for the parseGeminiResponse function.
 * - ParseGeminiResponseOutput - The return type for the parseGeminiResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseGeminiResponseInputSchema = z.object({
  geminiResponse: z.string().describe('The textual response from the Gemini Pro Vision model.'),
  // sceneContext: z.string().describe('The context of the scene provided by the user.'), // Removed sceneContext
  videoTimestamp: z.string().describe('The timestamp of the video frame.'),
  incidentCategories: z.array(z.string()).describe('A list of incident categories to look for.'),
});
export type ParseGeminiResponseInput = z.infer<typeof ParseGeminiResponseInputSchema>;

const IncidentDetailsSchema = z.object({
  incidentType: z.string().describe('The type of incident detected.'),
  description: z.string().describe('A detailed description of the incident.'),
  location: z.string().describe('The apparent location of the incident within the frame.'),
});

const ParseGeminiResponseOutputSchema = z.array(IncidentDetailsSchema).describe('A list of detected incident details.');
export type ParseGeminiResponseOutput = z.infer<typeof ParseGeminiResponseOutputSchema>;

export async function parseGeminiResponse(input: ParseGeminiResponseInput): Promise<ParseGeminiResponseOutput> {
  return parseGeminiResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseGeminiResponsePrompt',
  input: {
    schema: ParseGeminiResponseInputSchema,
  },
  output: {
    schema: ParseGeminiResponseOutputSchema,
  },
  prompt: `You are an expert in parsing incident reports from AI vision models.

  Your task is to analyze the Gemini response provided below, extract any identified incidents, and return a structured JSON array containing details for each incident.

  Here's some relevant information:
  - Video Timestamp: {{{videoTimestamp}}}
  - Incident Categories: {{{incidentCategories}}}

  Gemini Response:
  {{{geminiResponse}}}

  For each detected incident, extract the following information:
  - Incident Type: The specific type of incident (e.g., Trespassing, Abandoned Object).
  - Description: A detailed description of the incident.
  - Location: The apparent location of the incident within the frame.

  If no incidents are detected, return an empty JSON array.

  Ensure the output is a valid JSON array of incident details, conforming to the following schema:
  ${JSON.stringify(IncidentDetailsSchema)}
  `,
});

const parseGeminiResponseFlow = ai.defineFlow(
  {
    name: 'parseGeminiResponseFlow',
    inputSchema: ParseGeminiResponseInputSchema,
    outputSchema: ParseGeminiResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
