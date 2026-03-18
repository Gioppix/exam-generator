import { z } from 'zod';
import {
    QuestionContentSchema,
    AnswerContentSchema,
    AnswerContentWithExplanationSchema
} from '../questions/types.js';

export { AnswerContentSchema as StudentAnswerContentSchema };
export type StudentAnswerContent = z.infer<typeof AnswerContentSchema>;

// ─── Exam status ─────────────────────────────────────────────────────────────

export const ExamStatusSchema = z.enum(['created', 'started', 'submitted', 'graded']);
export type ExamStatus = z.infer<typeof ExamStatusSchema>;

// ─── Exam question (as returned by the API) ───────────────────────────────────

export const ExamQuestionSchema = z.object({
    question_id: z.string().uuid(),
    question: QuestionContentSchema,
    student_answer: AnswerContentSchema.optional(),
    reported_at: z.string().nullable(),
    /** Only included when graded */
    correct_answer: AnswerContentWithExplanationSchema.optional(),
    grade: z.number().nullable().optional(),
    grading_comment: z.string().nullable().optional()
});

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;

/** Full exam detail (includes questions) */
export const ExamDetailSchema = z.object({
    exam_id: z.string().uuid(),
    exam_title: z.string(),
    student_id: z.string().uuid(),
    created_at: z.string(),
    started_at: z.string().nullable(),
    submitted_at: z.string().nullable(),
    graded_at: z.string().nullable(),
    grade: z.number().nullable(),
    status: ExamStatusSchema,
    questions: z.array(ExamQuestionSchema)
});

export type ExamDetail = z.infer<typeof ExamDetailSchema>;

// ─── Exam summary (list view, no questions) ───────────────────────────────────

export const ExamSummarySchema = z.object({
    exam_id: z.string().uuid(),
    exam_title: z.string(),
    created_at: z.string(),
    started_at: z.string().nullable(),
    submitted_at: z.string().nullable(),
    graded_at: z.string().nullable(),
    grade: z.number().nullable(),
    status: ExamStatusSchema,
    question_count: z.number()
});

export type ExamSummary = z.infer<typeof ExamSummarySchema>;

// ─── Request bodies ───────────────────────────────────────────────────────────

export const CreateExamBodySchema = z.object({
    prompt: z.string().min(1),
    student_id: z.string().uuid()
});

export type CreateExamBody = z.infer<typeof CreateExamBodySchema>;

export const SubmitAnswerBodySchema = z.object({
    answer: AnswerContentSchema.optional()
});

export type SubmitAnswerBody = z.infer<typeof SubmitAnswerBodySchema>;
