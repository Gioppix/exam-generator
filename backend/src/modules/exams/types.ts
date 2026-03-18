import { z } from 'zod';
import { QuestionContentSchema, AnswerContentSchema } from '../questions/types.js';

// ─── Student-submitted answers (no explanation field) ────────────────────────

export const StudentMultipleChoiceAnswerSchema = z.object({
    type: z.literal('multiple_choice'),
    selected_index: z.array(z.number())
});

export const StudentOpenEndedAnswerSchema = z.object({
    type: z.literal('open_ended'),
    answer: z.string()
});

export const StudentBooleanAnswerSchema = z.object({
    type: z.literal('boolean'),
    answer: z.boolean()
});

export const StudentMatchingAnswerSchema = z.object({
    type: z.literal('matching'),
    pairs: z.array(z.object({ left_index: z.number(), right_index: z.number() }))
});

export const StudentAnswerContentSchema = z.union([
    StudentMultipleChoiceAnswerSchema,
    StudentOpenEndedAnswerSchema,
    StudentBooleanAnswerSchema,
    StudentMatchingAnswerSchema
]);

export type StudentAnswerContent = z.infer<typeof StudentAnswerContentSchema>;

// ─── Exam status ─────────────────────────────────────────────────────────────

export const ExamStatusSchema = z.enum(['created', 'started', 'submitted', 'graded']);
export type ExamStatus = z.infer<typeof ExamStatusSchema>;

// ─── Exam question (as returned by the API) ───────────────────────────────────

export const ExamQuestionSchema = z.object({
    question_id: z.string().uuid(),
    question: QuestionContentSchema,
    student_answer: z
        .union([
            StudentMultipleChoiceAnswerSchema,
            StudentOpenEndedAnswerSchema,
            StudentBooleanAnswerSchema,
            StudentMatchingAnswerSchema
        ])
        .optional(),
    reported_at: z.string().nullable(),
    // Only included when graded:
    correct_answer: AnswerContentSchema.optional(),
    grade: z.number().nullable().optional(),
    grading_comment: z.string().nullable().optional()
});

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;

// ─── Full exam detail (includes questions) ────────────────────────────────────

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
    answer: z.union([StudentAnswerContentSchema]).optional()
});

export type SubmitAnswerBody = z.infer<typeof SubmitAnswerBodySchema>;
