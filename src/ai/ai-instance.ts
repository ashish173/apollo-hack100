import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      // apiKey: process.env.GOOGLE_GENAI_API_KEY,
      apiKey: 'AIzaSyAzrmKYIujxximaQNCDW8PMng2slmQYhnA',
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
