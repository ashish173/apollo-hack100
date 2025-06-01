// src/ai/flows/generate-project-ideas.ts
"use server";

/**
 * @fileOverview Generates project ideas based on a given topic or subject.
 *
 * - generateProjectIdeas - A function that generates project ideas.
 * - GenerateProjectIdeasInput - The input type for the generateProjectIdeas function.
 * - GenerateProjectIdeasOutput - The return type for the generateProjectIdeas function.
 */

import { ai } from "@/ai/ai-instance";
import { z } from "genkit";

const ProjectIdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.string(),
  duration: z.string(),
});

const GenerateProjectIdeasInputSchema = z.object({
  topic: z
    .string()
    .describe("The topic or subject to generate project ideas for."),
  difficulty: z.string().describe("The project difficulty level."),
  duration: z.string().describe("The project duration to complete."),
});
export type GenerateProjectIdeasInput = z.infer<
  typeof GenerateProjectIdeasInputSchema
>;

const GenerateProjectIdeasOutputSchema = z.object({
  ideas: z.array(ProjectIdeaSchema).describe("An array of project ideas."),
});
export type GenerateProjectIdeasOutput = z.infer<
  typeof GenerateProjectIdeasOutputSchema
>;

export async function generateProjectIdeas(
  input: GenerateProjectIdeasInput
): Promise<GenerateProjectIdeasOutput> {
  return generateProjectIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateProjectIdeasPrompt",
  input: {
    schema: z.object({
      topic: z
        .string()
        .describe("The topic or subject to generate project ideas for."),
      difficulty: z.string().describe("The project difficulty level."),
      duration: z.string().describe("The project duration to complete."),
    }),
  },
  output: {
    schema: z.object({
      ideas: z.array(ProjectIdeaSchema).describe("An array of project ideas."),
    }),
  },
  // KEY PROMPT
  // prompt: `You are an experienced teacher.
  // Generate a list of project ideas for the following topic or subject: {{{topic}}}.
  // Give very brief one-line descriptions of the ideas, so the teacher understands them.
  // Return 5 ideas.`,

  // The MOST Important project.
  // TODO: ADD DURATION AND DIFFICULTY LEVEL TO THE PROMPT
  prompt: `You are an Expert Teacher with advanced expertise in discipline/faculty of {{topic}} and 
    real-world applications of academic knowledge. Your task is to generate five project ideas 
    for the following topic or subject: {{topic}} with difficulty level {{difficulty}} and duration {{duration}}.
    that captivate graduate-level learners by addressing real-world problems or components of 
    larger societal, technological, environmental, or interdisciplinary challenges. 
    Each idea should be engaging, relatable, and aligned with the skills and rigor 
    expected of graduate students (e.g., requiring research, technical expertise, or 
    innovative thinking). Ensure the ideas are feasible for implementation within a 
    graduate program’s timeframe and resources. Provide each idea as a object with title, 
    description, difficulty, duration that includes the problem and a suggested solution approach, enabling the 
    teacher to understand the project’s scope and relevance.

    Return ideas in below format
      {
        id: '1',
        title: 'Interactive Storytelling Web App',
        description: 'Develop a web application where users can create and navigate through branching story narratives. Focus on UI/UX for an engaging experience.',
        difficulty: 'Medium',
        duration: '5+ Weeks',
      }
    `,
});

const generateProjectIdeasFlow = ai.defineFlow<
  typeof GenerateProjectIdeasInputSchema,
  typeof GenerateProjectIdeasOutputSchema
>(
  {
    name: "generateProjectIdeasFlow",
    inputSchema: GenerateProjectIdeasInputSchema,
    outputSchema: GenerateProjectIdeasOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
