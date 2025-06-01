import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
const { defineString } = require("firebase-functions/params");

const geminiApiKey = defineString("GOOGLE_GENAI_API_KEY");
const GEMINI_API_KEY = geminiApiKey.value();

export const ai = genkit({
  promptDir: "./prompts",
  plugins: [
    googleAI({
      apiKey: GEMINI_API_KEY,
    }),
  ],
  model: "googleai/gemini-2.0-flash",
});
