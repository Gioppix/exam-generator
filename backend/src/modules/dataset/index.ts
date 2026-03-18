import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { Topic } from '../topics/types.js';
import { QuestionContentSchema, AnswerContentWithExplanationSchema } from '../questions/types.js';
import { insertQuestion } from './db.js';

export const OutlineSchema = z.object({
    title: z.string(),
    description: z.string(),
    topic_names: z
        .array(z.string())
        .describe(
            'Most-specific topic labels from the provided tree. If a child topic is included, its parent must NOT be included.'
        )
});

export const TitleListSchema = z.object({ questions: z.array(OutlineSchema) });
export type Outline = z.infer<typeof OutlineSchema>;

export const FullQuestionSchema = z.object({
    question: QuestionContentSchema,
    answer: AnswerContentWithExplanationSchema
});

export async function generateOutlines(
    prompt: string,
    existingTitles: string[],
    topicTreeText: string
): Promise<Outline[]> {
    const { object } = await generateObject({
        model: openai('gpt-5.4'),
        schema: TitleListSchema,
        prompt: `Generate exam question outlines about: "${prompt}".
${existingTitles.length > 0 ? `Existing question titles (avoid duplicates): ${existingTitles.join('; ')}` : ''}

Available topics (indented tree — child topics are more specific than their parents):
${topicTreeText || '(none)'}

For each question:
- Provide a short title and a one-sentence description of what it should test and which type to use (multiple_choice, open_ended, boolean, or matching).
- Assign topic_names using only labels from the tree above.
- Choose the most specific (deepest) applicable topics. If you include a child topic, do NOT also include any of its ancestors.
If the amount is not specified, generate 10 questions.`
    });
    return object.questions;
}

export async function generateAndInsertQuestion(
    outline: Outline,
    allTopics: Topic[]
): Promise<void> {
    const { object: full } = await generateObject({
        model: openai('gpt-5.4'),
        schema: FullQuestionSchema,
        prompt: `Generate a complete exam question and its correct answer.
Title: "${outline.title}"
Description: "${outline.description}"
The question.type and answer.type must match.
For multiple_choice include at least 3 answer options.
For matching include at least 3 left/right pairs.`
    });

    await insertQuestion(outline.title, full.question, full.answer, outline.topic_names, allTopics);
}
