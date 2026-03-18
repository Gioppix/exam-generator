import { z } from 'zod';
import { pool } from '../db.js';
import { QuestionContentSchema, AnswerContentSchema } from '../questions/types.js';
import {
    ExamDetailSchema,
    ExamSummarySchema,
    StudentAnswerContentSchema,
    type ExamDetail,
    type ExamSummary,
    type StudentAnswerContent
} from './types.js';

function toISO(d: Date | string | null | undefined): string | null {
    if (!d) return null;
    return d instanceof Date ? d.toISOString() : d;
}

function deriveStatus(row: {
    started_at: Date | string | null;
    submitted_at: Date | string | null;
    graded_at: Date | string | null;
}): string {
    if (row.graded_at) return 'graded';
    if (row.submitted_at) return 'submitted';
    if (row.started_at) return 'started';
    return 'created';
}

export async function createExam(student_id: string, exam_title: string): Promise<string> {
    const { rows } = await pool.query<{ exam_id: string }>(
        'INSERT INTO exams (student_id, exam_title) VALUES ($1, $2) RETURNING exam_id',
        [student_id, exam_title]
    );
    return rows[0].exam_id;
}

export async function insertExamQuestions(exam_id: string, question_ids: string[]): Promise<void> {
    for (const question_id of question_ids) {
        await pool.query('INSERT INTO exam_questions (exam_id, question_id) VALUES ($1, $2)', [
            exam_id,
            question_id
        ]);
    }
}

export async function listExams(student_id: string): Promise<ExamSummary[]> {
    const { rows } = await pool.query(
        `SELECT
            e.exam_id,
            e.exam_title,
            e.created_at,
            e.started_at,
            e.submitted_at,
            e.graded_at,
            e.grade,
            CAST(COUNT(eq.question_id) AS INTEGER) AS question_count
        FROM exams e
        LEFT JOIN exam_questions eq ON eq.exam_id = e.exam_id
        WHERE e.student_id = $1
        GROUP BY e.exam_id
        ORDER BY e.created_at DESC`,
        [student_id]
    );
    return z.array(ExamSummarySchema).parse(
        rows.map((r) => ({
            ...r,
            created_at: toISO(r.created_at),
            started_at: toISO(r.started_at),
            submitted_at: toISO(r.submitted_at),
            graded_at: toISO(r.graded_at),
            grade: r.grade ?? null,
            status: deriveStatus(r)
        }))
    );
}

export async function getExam(exam_id: string): Promise<ExamDetail | null> {
    const { rows: examRows } = await pool.query(
        `SELECT exam_id, exam_title, student_id, created_at, started_at, submitted_at, graded_at, grade
         FROM exams WHERE exam_id = $1`,
        [exam_id]
    );
    if (!examRows[0]) return null;
    const exam = examRows[0];
    const status = deriveStatus(exam);
    const isGraded = status === 'graded';

    const { rows: qRows } = await pool.query(
        `SELECT
            eq.question_id,
            q.question,
            eq.answer AS student_answer,
            eq.reported_at,
            q.answer AS correct_answer,
            eq.grade,
            eq.grading_comment
        FROM exam_questions eq
        JOIN questions q ON q.question_id = eq.question_id
        WHERE eq.exam_id = $1`,
        [exam_id]
    );

    const questions = qRows.map((r) => ({
        question_id: r.question_id,
        question: QuestionContentSchema.parse(r.question),
        ...(r.student_answer && {
            student_answer: StudentAnswerContentSchema.parse(r.student_answer)
        }),
        reported_at: toISO(r.reported_at),
        ...(isGraded && {
            correct_answer: AnswerContentSchema.parse(r.correct_answer),
            grade: r.grade ?? null,
            grading_comment: r.grading_comment ?? null
        })
    }));

    return ExamDetailSchema.parse({
        exam_id: exam.exam_id,
        exam_title: exam.exam_title,
        student_id: exam.student_id,
        created_at: toISO(exam.created_at),
        started_at: toISO(exam.started_at),
        submitted_at: toISO(exam.submitted_at),
        graded_at: toISO(exam.graded_at),
        grade: exam.grade ?? null,
        status,
        questions
    });
}

export async function startExam(exam_id: string): Promise<void> {
    await pool.query(
        'UPDATE exams SET started_at = NOW() WHERE exam_id = $1 AND started_at IS NULL',
        [exam_id]
    );
}

export async function submitAnswer(
    exam_id: string,
    question_id: string,
    answer: StudentAnswerContent | undefined
): Promise<void> {
    await pool.query(
        'UPDATE exam_questions SET answer = $1 WHERE exam_id = $2 AND question_id = $3',
        [answer !== undefined ? JSON.stringify(answer) : null, exam_id, question_id]
    );
}

export async function reportQuestion(exam_id: string, question_id: string): Promise<void> {
    await pool.query(
        'UPDATE exam_questions SET reported_at = NOW() WHERE exam_id = $1 AND question_id = $2',
        [exam_id, question_id]
    );
}
