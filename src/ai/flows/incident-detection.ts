
// incident-detection.ts
'use server';
/**
 * @fileOverview Identifies public safety incidents in video frames using Gemini Pro Vision.
 * AI will infer context from the frame, use current real-world time in descriptions,
 * and generate fictional Indian locations.
 *
 * - analyzeFrame - Analyzes a video frame for public safety incidents.
 * - AnalyzeFrameInput - The input type for the analyzeFrame function.
 * - AnalyzeFrameOutput - The return type for the analyzeFrame function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFrameInputSchema = z.object({
  frameDataUri: z
    .string()
    .describe(
      "A video frame, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  timestamp: z.string().describe('The timestamp of the frame in the video (e.g., "15.3s").'),
  currentTimeISO: z.string().describe('The current real-world time in ISO format when the frame is being analyzed.'),
});
export type AnalyzeFrameInput = z.infer<typeof AnalyzeFrameInputSchema>;

const AnalyzeFrameOutputSchema = z.object({
  incidents: z.array(
    z.object({
      incidentType: z.string().describe('The type of incident detected.'),
      description: z.string().describe('A detailed description of the incident, prepended with "Observed at [currentTimeISO]: ".'),
      location: z.string().describe('A plausible fictional public place or street name within India that matches the general scene depicted.'),
      confidence: z.number().describe('The confidence level of the detection (0-1).'),
      severity: z.string().describe('The severity level of the incident (Low, Medium, High, or Critical).'),
    })
  ).describe('A list of public safety incidents detected in the frame.'),
});
export type AnalyzeFrameOutput = z.infer<typeof AnalyzeFrameOutputSchema>;

export async function analyzeFrame(input: AnalyzeFrameInput): Promise<AnalyzeFrameOutput> {
  return analyzeFrameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'incidentDetectionPrompt',
  input: {schema: AnalyzeFrameInputSchema},
  output: {schema: AnalyzeFrameOutputSchema},
  prompt: `You are an AI assistant specializing in public safety incident detection.

You are tasked with analyzing video frames to identify potential public safety incidents. Analyze the following frame.
The frame was captured at video time: {{{timestamp}}}.
The current real-world analysis time is: {{{currentTimeISO}}}.

Infer the context from the visual information within the frame (e.g., time of day, location type like 'indoor office' or 'outdoor street', presence of individuals, objects, environmental conditions).

Based on this inferred visual context, identify any incidents falling into these categories: Trespassing, Abandoned Object, Suspicious Loitering, Crowd Disturbance, Road Hazards. For each detected incident, provide:
1. Incident Type
2. A detailed Description. **Crucially, begin this description by stating "Observed at {{{currentTimeISO}}}: " followed by the rest of the incident description.** For example: "Observed at {{{currentTimeISO}}}: Suspicious individual loitering near the ATM."
3. Location. **Instead of describing the location *within the frame*, provide a *plausible fictional public place or street name within India* that could match the general scene depicted.** For example, if it's a busy street, suggest 'MG Road, Bangalore' or 'Chandni Chowk, Delhi'. If it's a park, suggest 'Cubbon Park, Bangalore' or 'Lodhi Garden, Delhi'. Be creative but contextually relevant to the visual information if possible. Do NOT use generic descriptions like 'center of frame' or 'road surface'.
4. A Confidence level (0-1)
5. A Severity level (assign one of: "Low", "Medium", "High", "Critical") based on the potential impact and urgency.

If no incidents are detected, return an empty list.

Frame: {{media url=frameDataUri}}

Output must be a JSON array of incidents, where each incident has the following fields: incidentType, description, location, confidence, severity.
`,
});

const analyzeFrameFlow = ai.defineFlow(
  {
    name: 'analyzeFrameFlow',
    inputSchema: AnalyzeFrameInputSchema,
    outputSchema: AnalyzeFrameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
