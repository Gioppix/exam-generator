import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { pool } from '../db.js';
import { QuestionContentSchema, AnswerContentWithExplanationSchema } from '../questions/types.js';
import { StudentAnswerContentSchema } from './types.js';

// ─── Fetch questions for grading ─────────────────────────────────────────────

async function fetchExamQuestionsForGrading(exam_id: string) {
    const { rows } = await pool.query(
        `SELECT
            eq.question_id,
            q.question,
            q.answer AS correct_answer,
            eq.answer AS student_answer
        FROM exam_questions eq
        JOIN questions q ON q.question_id = eq.question_id
        WHERE eq.exam_id = $1`,
        [exam_id]
    );
    return rows.map((r) => ({
        question_id: r.question_id as string,
        question: QuestionContentSchema.parse(r.question),
        correct_answer: AnswerContentWithExplanationSchema.parse(r.correct_answer),
        student_answer: r.student_answer
            ? StudentAnswerContentSchema.parse(r.student_answer)
            : undefined
    }));
}

// ─── Automatic graders ───────────────────────────────────────────────────────

function gradeMultipleChoice(correctIndices: number[], studentIndices: number[]): number {
    if (correctIndices.length === 0) return 1;
    const correctSet = new Set(correctIndices);
    const studentSet = new Set(studentIndices);
    const hits = [...studentSet].filter((i) => correctSet.has(i)).length;
    const wrong = [...studentSet].filter((i) => !correctSet.has(i)).length;
    return Math.max(0, (hits - wrong) / correctIndices.length);
}

function gradeBoolean(correct: boolean, student: boolean): number {
    return correct === student ? 1 : 0;
}

function gradeMatching(
    correctPairs: { left_index: number; right_index: number }[],
    studentPairs: { left_index: number; right_index: number }[]
): number {
    if (correctPairs.length === 0) return 1;
    const correctMap = new Map(correctPairs.map((p) => [p.left_index, p.right_index]));
    const hits = studentPairs.filter((p) => correctMap.get(p.left_index) === p.right_index).length;
    return hits / correctPairs.length;
}

// ─── LLM grader for open-ended ───────────────────────────────────────────────

const OpenEndedGradeSchema = z.object({
    grade: z.number().min(0).max(1).describe('Grade from 0 (wrong) to 1 (fully correct)'),
    comment: z.string().describe('Brief explanation of the grade')
});

async function gradeOpenEnded(
    prompt: string,
    correctAnswer: string,
    studentAnswer: string
): Promise<{ grade: number; comment: string }> {
    const { object } = await generateObject({
        model: openai('gpt-5.4'),
        schema: OpenEndedGradeSchema,
        prompt: `You are grading an open-ended exam question.

Question: ${prompt}

Correct answer: ${correctAnswer}

Student answer: ${studentAnswer}

Grade the student's answer from 0 to 1 (0 = completely wrong, 0.5 = partially correct, 1 = fully correct). Provide a brief explanation.`
    });
    return { grade: object.grade, comment: object.comment };
}

// ─── Main grading entry point ─────────────────────────────────────────────────

export async function gradeExam(exam_id: string): Promise<void> {
    const questions = await fetchExamQuestionsForGrading(exam_id);

    const grades: { question_id: string; grade: number; comment: string | null }[] = [];

    for (const { question_id, question, correct_answer, student_answer } of questions) {
        if (!student_answer) {
            grades.push({ question_id, grade: 0, comment: 'No answer submitted' });
            continue;
        }

        let grade: number;
        let comment: string | null = null;

        if (
            question.type === 'open_ended' &&
            student_answer.type === 'open_ended' &&
            correct_answer.type === 'open_ended'
        ) {
            const result = await gradeOpenEnded(
                question.prompt,
                correct_answer.answer,
                student_answer.answer
            );
            grade = result.grade;
            comment = result.comment;
        } else if (
            question.type === 'multiple_choice' &&
            student_answer.type === 'multiple_choice' &&
            correct_answer.type === 'multiple_choice'
        ) {
            grade = gradeMultipleChoice(
                correct_answer.selected_index,
                student_answer.selected_index
            );
        } else if (
            question.type === 'boolean' &&
            student_answer.type === 'boolean' &&
            correct_answer.type === 'boolean'
        ) {
            grade = gradeBoolean(correct_answer.answer, student_answer.answer);
        } else if (
            question.type === 'matching' &&
            student_answer.type === 'matching' &&
            correct_answer.type === 'matching'
        ) {
            grade = gradeMatching(correct_answer.pairs, student_answer.pairs);
        } else {
            grade = 0;
            comment = 'Answer type mismatch';
        }

        grades.push({ question_id, grade, comment });
    }

    // Persist per-question grades
    for (const { question_id, grade, comment } of grades) {
        await pool.query(
            'UPDATE exam_questions SET grade = $1, grading_comment = $2 WHERE exam_id = $3 AND question_id = $4',
            [grade, comment, exam_id, question_id]
        );
    }

    // Overall grade = average across all questions
    const overallGrade =
        grades.length > 0 ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length : null;

    await pool.query(
        `UPDATE exams
         SET submitted_at = COALESCE(submitted_at, NOW()),
             graded_at    = NOW(),
             grade        = $1
         WHERE exam_id = $2`,
        [overallGrade, exam_id]
    );
}
