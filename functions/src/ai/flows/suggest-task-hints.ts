"use server";

/**
 * @fileOverview Provides task hints and suggestions for students.
 *
 * - suggestTaskHints - A function to generate hints and suggestions for a given task.
 * - SuggestTaskHintsInput - The input type for the suggestTaskHints function.
 * - SuggestTaskHintsOutput - The return type for the suggestTaskHints function.
 */

import { ai } from "./../ai-instance";
import { z } from "genkit";

const SuggestTaskHintsInputSchema = z.object({
  taskDescription: z
    .string()
    .describe("The description of the task for which hints are needed."),
  projectGoal: z.string().describe("The overall goal of the project."),
  relevantMilestones: z
    .string()
    .describe("The relevant milestones associated with the task."),
});
export type SuggestTaskHintsInput = z.infer<typeof SuggestTaskHintsInputSchema>;

const SuggestTaskHintsOutputSchema = z.object({
  hints: z
    .array(z.string().describe("A list of hints and suggestions for the task."))
    .describe(
      "Hints and suggestions to accomplish the task goals and complete milestones."
    ),
});
export type SuggestTaskHintsOutput = z.infer<
  typeof SuggestTaskHintsOutputSchema
>;

export async function suggestTaskHints(
  input: SuggestTaskHintsInput
): Promise<SuggestTaskHintsOutput> {
  return suggestTaskHintsFlow(input);
}

const prompt = ai.definePrompt({
  name: "suggestTaskHintsPrompt",
  input: {
    schema: z.object({
      taskDescription: z
        .string()
        .describe("The description of the task for which hints are needed."),
      projectGoal: z.string().describe("The overall goal of the project."),
      relevantMilestones: z
        .string()
        .describe("The relevant milestones associated with the task."),
    }),
  },
  output: {
    schema: z.object({
      hints: z
        .array(
          z.string().describe("A list of hints and suggestions for the task.")
        )
        .describe(
          "Hints and suggestions to accomplish the task goals and complete milestones."
        ),
    }),
  },
  prompt: `You are an AI assistant helping students by providing hints and suggestions for their tasks.

  Based on the task description, project goal, and relevant milestones, provide a list of hints and suggestions to help the student accomplish the task.

  Task Description: {{{taskDescription}}}
  Project Goal: {{{projectGoal}}}
  Relevant Milestones: {{{relevantMilestones}}}

  Provide at least 3 hints.
  `,
});

const suggestTaskHintsFlow = ai.defineFlow<
  typeof SuggestTaskHintsInputSchema,
  typeof SuggestTaskHintsOutputSchema
>(
  {
    name: "suggestTaskHintsFlow",
    inputSchema: SuggestTaskHintsInputSchema,
    outputSchema: SuggestTaskHintsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
