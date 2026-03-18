import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { listQuestions } from '../questions/index.js';
import { listTopics, buildTopicTreeText } from '../topics/index.js';
import { createExam, insertExamQuestions } from './db.js';
import { getMe } from '../auth/index.js';

const QuestionSelectionSchema = z.object({
    exam_title: z
        .string()
        .describe('A short, descriptive title for this exam based on the request.'),
    selected_question_ids: z
        .array(z.string())
        .describe('IDs of questions to include in the exam. Select 5–15 questions.')
});

// TODO: make this filter by topic and use tools
export async function generateExam(prompt: string, student_id: string): Promise<string> {
    const [questions, topics, student] = await Promise.all([
        listQuestions(),
        listTopics(),
        getMe(student_id)
    ]);

    const activeQuestions = questions.filter((q) => q.active);

    if (activeQuestions.length === 0) {
        return createExam(student_id, prompt);
    }

    const topicTreeText = buildTopicTreeText(topics);
    const topicMap = new Map(topics.map((t) => [t.topic_id, t.label]));

    const questionSummaries = activeQuestions
        .map((q) => {
            const topicLabels = q.topic_ids
                .map((id) => topicMap.get(id))
                .filter(Boolean)
                .join(', ');
            return `ID: ${q.question_id} | Title: ${q.title} | Type: ${q.question.type} | Topics: ${topicLabels}`;
        })
        .join('\n');

    const studentContext = student
        ? [
              student.grade_level ? `Grade level: ${student.grade_level}` : null,
              student.country ? `Country: ${student.country}` : null
          ]
              .filter(Boolean)
              .join('\n')
        : null;

    const { object } = await generateObject({
        model: openai('gpt-5.4'),
        schema: QuestionSelectionSchema,
        prompt: `You are building an exam based on this request: "${prompt}"
${studentContext ? `\nStudent context:\n${studentContext}\n` : ''}
Available topic tree:
${topicTreeText}

Available questions:
${questionSummaries}

Select questions relevant to the request. Pick 5–15 questions that best cover the requested topic. Only return IDs from the list above.
Also generate a short, descriptive exam title based on the request (e.g. "Quadratic Equations Quiz", "Algebra Basics Assessment").`
    });

    const validIds = new Set(activeQuestions.map((q) => q.question_id));
    const selectedIds = object.selected_question_ids.filter((id) => validIds.has(id));

    const exam_id = await createExam(student_id, object.exam_title);
    if (selectedIds.length > 0) {
        await insertExamQuestions(exam_id, selectedIds);
    }
    return exam_id;
}
