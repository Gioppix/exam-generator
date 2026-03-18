import { z } from 'zod';

// ─── Question content (stored in `question` jsonb column) ───────────────────

export const MultipleChoiceQuestionSchema = z.object({
    type: z.literal('multiple_choice'),
    prompt: z.string(),
    answers: z.array(z.string())
});

export const OpenEndedQuestionSchema = z.object({
    type: z.literal('open_ended'),
    prompt: z.string()
});

export const BooleanQuestionSchema = z.object({
    type: z.literal('boolean'),
    prompt: z.string()
});

export const MatchingQuestionSchema = z.object({
    type: z.literal('matching'),
    prompt: z.string(),
    left: z.array(z.string()),
    right: z.array(z.string())
});

export const QuestionContentSchema = z.union([
    MultipleChoiceQuestionSchema,
    OpenEndedQuestionSchema,
    BooleanQuestionSchema,
    MatchingQuestionSchema
]);

export type QuestionContent = z.infer<typeof QuestionContentSchema>;

// ─── Answer content (stored in `answer` jsonb column) ───────────────────────
// For matching, left[i] correctly pairs with right[i].

const AnswerBaseSchema = z.object({ explanation: z.string().nullable() });

export const MultipleChoiceAnswerSchema = AnswerBaseSchema.extend({
    type: z.literal('multiple_choice'),
    selected_index: z.array(z.number())
});

export const OpenEndedAnswerSchema = AnswerBaseSchema.extend({
    type: z.literal('open_ended'),
    answer: z.string()
});

export const BooleanAnswerSchema = AnswerBaseSchema.extend({
    type: z.literal('boolean'),
    answer: z.boolean()
});

export const MatchingAnswerSchema = AnswerBaseSchema.extend({
    type: z.literal('matching'),
    // Each pair indicates which left item matches which right item
    pairs: z.array(z.object({ left_index: z.number(), right_index: z.number() }))
});

export const AnswerContentSchema = z.union([
    MultipleChoiceAnswerSchema,
    OpenEndedAnswerSchema,
    BooleanAnswerSchema,
    MatchingAnswerSchema
]);

export type AnswerContent = z.infer<typeof AnswerContentSchema>;

// ─── Full question row ───────────────────────────────────────────────────────

export const QuestionSchema = z.object({
    question_id: z.string().uuid(),
    active: z.boolean(),
    title: z.string(),
    question: QuestionContentSchema,
    answer: AnswerContentSchema,
    topic_ids: z.array(z.string().uuid())
});

export type Question = z.infer<typeof QuestionSchema>;
