"use server";

/**
 * @fileOverview Generates curriculum suggestions including lesson structure, experiments, opening remarks, and post-lecture resources.
 *
 * - generateCurriculumSuggestions - A function that generates comprehensive lesson plan suggestions.
 * - GenerateCurriculumSuggestionsInput - The input type for the generateCurriculumSuggestions function.
 * - GenerateCurriculumSuggestionsOutput - The output type for the generateCurriculumSuggestions function.
 */

import { ai } from "@/ai/ai-instance";
import { z } from "genkit";

const GenerateCurriculumSuggestionsInputSchema = z.object({
  lessonTopic: z.string().describe("The main topic of the lesson"),
  subject: z
    .string()
    .describe("The subject area (e.g., Computer Science, Mathematics)"),
  classLevel: z
    .string()
    .describe("The class level (e.g., 1st Year UG, Postgraduate)"),
  classDuration: z.string().describe("Duration of the class in minutes"),
  classSize: z
    .string()
    .describe("Size of the class (Small, Medium, Large, Very Large)"),
  availableResources: z
    .string()
    .optional()
    .describe("Available resources in the classroom"),
  learningObjectives: z
    .string()
    .optional()
    .describe("Specific learning objectives for the lesson"),
});
export type GenerateCurriculumSuggestionsInput = z.infer<
  typeof GenerateCurriculumSuggestionsInputSchema
>;

const GenerateCurriculumSuggestionsOutputSchema = z.object({
  curriculumSuggestions: z
    .string()
    .describe(
      "The generated curriculum suggestions with lesson structure, experiment, opening remarks, and resources in JSON format."
    ),
});
export type GenerateCurriculumSuggestionsOutput = z.infer<
  typeof GenerateCurriculumSuggestionsOutputSchema
>;

export async function generateCurriculumSuggestions(
  input: GenerateCurriculumSuggestionsInput
): Promise<GenerateCurriculumSuggestionsOutput> {
  return generateCurriculumSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateCurriculumSuggestionsPrompt",
  input: {
    schema: GenerateCurriculumSuggestionsInputSchema,
  },
  output: {
    schema: GenerateCurriculumSuggestionsOutputSchema,
  },
  prompt: `You are an Expert Teacher and Curriculum Designer with extensive experience in Indian higher education, 
particularly in State Public Universities (SPUs). Your mission is to transform boring, theoretical lectures into 
engaging, interactive learning experiences that make students excited about the subject.

You will create a comprehensive lesson plan suggestion for:
- Topic: {{{lessonTopic}}}
- Subject: {{{subject}}}
- Class Level: {{{classLevel}}}
- Duration: {{{classDuration}}} minutes
- Class Size: {{{classSize}}}
{{#if availableResources}}- Available Resources: {{{availableResources}}}{{/if}}
{{#if learningObjectives}}- Learning Objectives: {{{learningObjectives}}}{{/if}}

Your output must include exactly these 4 components:

1. **ENGAGING LESSON STRUCTURE**: Design a lesson structure that transforms traditional boring lectures into interactive, 
   engaging experiences. Break the lesson into distinct phases with:
   - Specific engagement strategies for each phase
   - Interactive activities that keep students involved
   - Time management that maintains energy and attention
   - Techniques to encourage participation and discussion
   - Methods to make theoretical concepts practical and relatable

2. **OPENING EXPERIMENT/DEMONSTRATION**: Create a simple but exciting experiment or hands-on demonstration that:
   - Can be performed at the very beginning of the lecture (first 5-10 minutes)
   - Gets students excited and curious about the topic
   - Uses materials readily available in Indian SPUs
   - Creates an "aha moment" or surprise element
   - Directly connects to the main lesson content
   - Is feasible for the given class size and resources

3. **OPENING REMARKS & CURIOSITY SPARKERS**: Provide specific opening remarks including:
   - A thought-provoking question that sparks curiosity and gets students thinking (include the answer explanation to help teachers guide discussion)
   - A fascinating, lesser-known fact related to the topic that will surprise students
   - A compelling story or real-world example from Indian context
   - Clear connection to how this topic impacts their daily lives or future careers
   - Industry applications showing relevance to Indian companies/startups

4. **POST-LECTURE LEARNING RESOURCES**: Suggest follow-up materials for students to explore after class:
   - Reading materials: Mix of articles, papers, and blog posts (specify difficulty levels)
   - Video resources: Educational videos with realistic durations from accessible platforms (include actual YouTube links, Khan Academy URLs, or Coursera links when possible)
   - Practice exercises: Detailed, step-by-step exercises with clear instructions, expected outcomes, and learning objectives
   - All resources should be easily accessible to Indian students (consider internet bandwidth)

**Critical Requirements:**
- Every suggestion must be IMMEDIATELY IMPLEMENTABLE by teachers
- Focus on ENGAGEMENT over traditional lecture methods
- Use Indian examples, companies, and cultural context wherever possible
- Consider typical SPU constraints (limited equipment, large classes, bandwidth issues)
- Address the core problem: making students excited about learning
- Bridge the gap between theory and real-world application
- Ensure all experiments use commonly available materials

Return the curriculum suggestions as a JSON object with this exact structure:

\`\`\`json
{
  "id": "unique-curriculum-id",
  "lessonStructure": {
    "title": "Engaging lesson title",
    "duration": "60 minutes",
    "objectives": [
      "Learning objective 1",
      "Learning objective 2", 
      "Learning objective 3"
    ],
    "phases": [
      {
        "name": "Hook & Engagement",
        "duration": "10 minutes",
        "activities": [
          "Opening activity 1",
          "Opening activity 2"
        ]
      },
      {
        "name": "Core Content Delivery", 
        "duration": "35 minutes",
        "activities": [
          "Core activity 1",
          "Core activity 2"
        ]
      },
      {
        "name": "Practice & Application",
        "duration": "10 minutes", 
        "activities": [
          "Practice activity 1",
          "Practice activity 2"
        ]
      },
      {
        "name": "Wrap-up & Preview",
        "duration": "5 minutes",
        "activities": [
          "Wrap-up activity 1",
          "Wrap-up activity 2"
        ]
      }
    ]
  },
  "experiment": {
    "title": "Experiment title",
    "duration": "8 minutes",
    "materials": [
      "Material 1",
      "Material 2",
      "Material 3"
    ],
    "procedure": [
      "Step 1: Detailed procedure",
      "Step 2: Detailed procedure", 
      "Step 3: Detailed procedure"
    ],
    "expectedOutcome": "What students will learn and realize from this experiment"
  },
  "openingRemarks": {
    "curiosityQuestion": "Thought-provoking question to engage students",
    "curiosityAnswer": "Clear explanation of the answer to help teacher guide discussion and reveal key insights",
    "funFact": "Fascinating lesser-known fact about the topic",
    "relatedStory": "Compelling story or real-world example from Indian context",
    "industryConnection": "How this topic is used in Indian companies/startups"
  },
  "postLectureResources": {
    "readingMaterials": [
      {
        "title": "Reading material title",
        "type": "Article/Book/Research Paper/Blog Post",
        "difficulty": "Beginner/Intermediate/Advanced",
        "url": "optional-url-if-available"
      }
    ],
    "videoResources": [
      {
        "title": "Video title",
        "duration": "12 minutes",
        "platform": "YouTube/Coursera/Khan Academy",
        "topic": "Specific topic covered",
        "url": "actual-youtube-or-educational-platform-link",
        "description": "Brief description of what students will learn from this video"
      }
    ],
    "practiceExercises": [
      {
        "title": "Exercise title",
        "type": "Practice/Assessment/Project/Observation",
        "estimatedTime": "30 minutes",
        "description": "Detailed step-by-step instructions for the exercise",
        "learningObjective": "What specific skill or concept this exercise reinforces",
        "expectedOutcome": "What students should be able to do after completing this exercise"
      }
    ]
  }
}
\`\`\`

Ensure the JSON is valid, complete, and directly addresses all 4 requirements with practical, immediately implementable suggestions.`,
});

const generateCurriculumSuggestionsFlow = ai.defineFlow<
  typeof GenerateCurriculumSuggestionsInputSchema,
  typeof GenerateCurriculumSuggestionsOutputSchema
>(
  {
    name: "generateCurriculumSuggestionsFlow",
    inputSchema: GenerateCurriculumSuggestionsInputSchema,
    outputSchema: GenerateCurriculumSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
