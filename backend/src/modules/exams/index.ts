import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import { listQuestions } from '../questions/index.js';
import { listTopics, buildTopicTreeText, getDescendantTopicIds } from '../topics/index.js';
import { createExam, insertExamQuestions } from './db.js';
import { getMe } from '../auth/index.js';
import type { Topic } from '../topics/types.js';

function createGetQuestionsTool(topics: Topic[]) {
    const topicMap = new Map(topics.map((t) => [t.topic_id, t.label]));
    return tool({
        description:
            'Fetch active questions for a topic and all its subtopics. Call this with the most relevant topic ID from the tree.',
        inputSchema: z.object({
            topic_id: z
                .string()
                .describe('The topic ID (UUID) to fetch questions for, including all descendants')
        }),
        execute: async ({ topic_id }) => {
            const descendantIds = getDescendantTopicIds(topic_id, topics);
            const questions = await listQuestions({ topic_ids: descendantIds });
            return questions
                .filter((q) => q.active)
                .map((q) => ({
                    id: q.question_id,
                    title: q.title,
                    type: q.question.type,
                    topics: q.topic_ids.map((id) => topicMap.get(id)).filter(Boolean)
                }));
        }
    });
}

type SelectionResult = { exam_title: string | null; selected_question_ids: string[] | null };

function createSelectQuestionsTool(result: SelectionResult) {
    return tool({
        description:
            'Finalize the exam by providing a short descriptive title and the selected question IDs.',
        inputSchema: z.object({
            exam_title: z
                .string()
                .describe('A short, descriptive exam title (e.g. "Quadratic Equations Quiz")'),
            selected_question_ids: z.array(z.string()).describe('IDs of questions to include')
        }),
        execute: async ({ exam_title, selected_question_ids }) => {
            result.exam_title = exam_title;
            result.selected_question_ids = selected_question_ids;
            return 'OK';
        }
    });
}

export async function generateExam(prompt: string, student_id: string): Promise<string> {
    const [topics, student] = await Promise.all([listTopics(), getMe(student_id)]);

    const topicTreeText = buildTopicTreeText(topics);

    const studentContext = student
        ? [
              student.grade_level ? `Grade level: ${student.grade_level}` : null,
              student.country ? `Country: ${student.country}` : null
          ]
              .filter(Boolean)
              .join('\n')
        : null;

    const selection: SelectionResult = { exam_title: null, selected_question_ids: null };

    await generateText({
        model: openai('gpt-5.4'),
        stopWhen: stepCountIs(5),
        tools: {
            get_questions: createGetQuestionsTool(topics),
            select_questions: createSelectQuestionsTool(selection)
        },
        prompt: `You are building an exam based on this request: "${prompt}"
${studentContext ? `\nStudent context:\n${studentContext}\n` : ''}
Available topic tree (format: topic_id — label):
${topics.map((t) => `${t.topic_id} — ${t.label}`).join('\n')}

Topic hierarchy:
${topicTreeText}

Steps:
1. Identify the most relevant topic(s) from the tree for this request.
2. Call get_questions with that topic_id to fetch available questions, as many times as you need.
3. Select 10 questions (unless the request specifies otherwise) that best match the request and student context.
4. [MANDATORY] Call select_questions with a short exam title and the selected question IDs.`
    });

    if (selection.exam_title === null || selection.selected_question_ids === null) {
        throw new Error('AI did not call select_questions');
    }

    const exam_id = await createExam(student_id, selection.exam_title);
    if (selection.selected_question_ids.length > 0) {
        await insertExamQuestions(exam_id, selection.selected_question_ids);
    }
    return exam_id;
}
