"use server";
/**
 * @fileOverview Generates a project plan with milestones and tasks for a given project idea.
 *
 * - generateProjectPlan - A function that generates a project plan.
 * - GenerateProjectPlanInput - The input type for the generateProjectPlan function.
 * - GenerateProjectPlanOutput - The output type for the generateProjectPlan function.
 */

import { ai } from "../ai-instance";
import { z } from "genkit";

const GenerateProjectPlanInputSchema = z.object({
  projectIdea: z.string().describe("The project idea to generate a plan for."),
});
export type GenerateProjectPlanInput = z.infer<
  typeof GenerateProjectPlanInputSchema
>;

const GenerateProjectPlanOutputSchema = z.object({
  projectPlan: z
    .string()
    .describe(
      "The generated project plan with milestones and tasks in JSON format."
    ),
});
export type GenerateProjectPlanOutput = z.infer<
  typeof GenerateProjectPlanOutputSchema
>;

export async function generateProjectPlan(
  input: GenerateProjectPlanInput
): Promise<GenerateProjectPlanOutput> {
  return generateProjectPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateProjectPlanPrompt",
  input: {
    schema: z.object({
      projectIdea: z
        .string()
        .describe("The project idea to generate a plan for."),
    }),
  },
  output: {
    schema: z.object({
      projectPlan: z
        .string()
        .describe(
          "The generated project plan with milestones and tasks in JSON format."
        ),
    }),
  },
  prompt: `You are an expert project manager. Generate a detailed project plan with milestones and tasks for the following project idea:

Project Idea: {{{projectIdea}}}

Ensure the plan includes clear, actionable tasks and realistic milestones.
Return the project plan as a JSON array. Each object in the array should have the following keys:
- TaskID: A unique identifier for the task (number).
- TaskName: A brief name for the task (string).
- StartDate: The start date of the task in YYYY-MM-DD format (string).
- EndDate: The end date of the task in YYYY-MM-DD format (string).
- Duration: The duration of the task in days (number).
- PercentageComplete: The percentage of the task that is complete (number between 0 and 100).
- Dependencies: A comma-separated list of TaskIDs that the task depends on (string, can be empty).
- Milestone: A boolean indicating whether the task is a milestone.

Here is an example of the JSON format:
\`\`\`json
[
  {
    "TaskID": 1,
    "TaskName": "Project Definition and Planning",
    "StartDate": "2024-01-29",
    "EndDate": "2024-01-30",
    "Duration": "2 days",
    "PercentageComplete": 100,
    "Dependencies": "",
    "Milestone": true
  },
  {
    "TaskID": 2,
    "TaskName": "Choose Real-World Application",
    "StartDate": "2024-01-31",
    "EndDate": "2024-02-01",
    "Duration": "2 days",
    "PercentageComplete": 100,
    "Dependencies": "1",
    "Milestone": false
  },
  {
    "TaskID": 3,
    "TaskName": "Research Differentiation Principles",
    "StartDate": "2024-02-02",
    "EndDate": "2024-02-04",
    "Duration": "3 days",
    "PercentageComplete": 100,
    "Dependencies": "2",
    "Milestone": false
  },
  {
    "TaskID": 4,
    "TaskName": "Research Application Details",
    "StartDate": "2024-02-05",
    "EndDate": "2024-02-07",
    "Duration": "3 days",
    "PercentageComplete": 100,
    "Dependencies": "2",
    "Milestone": false
  },
  {
    "TaskID": 5,
    "TaskName": "Draft Presentation Outline",
    "StartDate": "2024-02-08",
    "EndDate": "2024-02-09",
    "Duration": "2 days",
    "PercentageComplete": 100,
    "Dependencies": "3,4",
    "Milestone": false
  },
  {
    "TaskID": 6,
    "TaskName": "Develop Presentation Slides",
    "StartDate": "2024-02-12",
    "EndDate": "2024-02-16",
    "Duration": "5 days",
    "PercentageComplete": 100,
    "Dependencies": "5",
    "Milestone": false
  },
  {
    "TaskID": 7,
    "TaskName": "Incorporate Visual Aids",
    "StartDate": "2024-02-19",
    "EndDate": "2024-02-20",
    "Duration": "2 days",
    "PercentageComplete": 100,
    "Dependencies": "6",
    "Milestone": false
  },
  {
    "TaskID": 8,
    "TaskName": "Review and Refine Slides",
    "StartDate": "2024-02-21",
    "EndDate": "2024-02-22",
    "Duration": "2 days",
    "PercentageComplete": 100,
    "Dependencies": "7",
    "Milestone": false
  },
  {
    "TaskID": 9,
    "TaskName": "Practice Presentation Delivery",
    "StartDate": "2024-02-23",
    "EndDate": "2024-02-26",
    "Duration": "2 days",
    "PercentageComplete": 100,
    "Dependencies": "8",
    "Milestone": false
  },
  {
    "TaskID": 10,
    "TaskName": "Final Presentation Polish",
    "StartDate": "2024-02-27",
    "EndDate": "2024-02-28",
    "Duration": "2 days",
    "PercentageComplete": 100,
    "Dependencies": "9",
    "Milestone": false
  },
  {
    "TaskID": 11,
    "TaskName": "Final Presentation Delivery",
    "StartDate": "2024-02-29",
    "EndDate": "2024-02-29",
    "Duration": "1 day",
    "PercentageComplete": 100,
    "Dependencies": "10",
    "Milestone": true
  }
]
\`\`\`
`,
});

const generateProjectPlanFlow = ai.defineFlow<
  typeof GenerateProjectPlanInputSchema,
  typeof GenerateProjectPlanOutputSchema
>(
  {
    name: "generateProjectPlanFlow",
    inputSchema: GenerateProjectPlanInputSchema,
    outputSchema: GenerateProjectPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
