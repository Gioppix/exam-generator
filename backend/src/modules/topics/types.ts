import { z } from 'zod';

export const TopicSchema = z.object({
    topic_id: z.string().uuid(),
    parent_topic_id: z.string().uuid().nullable(),
    label: z.string()
});

export type Topic = z.infer<typeof TopicSchema>;

export const CreateTopicBodySchema = z.object({
    label: z.string().min(1),
    parent_topic_id: z.string().uuid().nullable().optional()
});

export type CreateTopicBody = z.infer<typeof CreateTopicBodySchema>;

export const GenerateTopicsBodySchema = z.object({
    context: z.string().min(1)
});

export type GenerateTopicsBody = z.infer<typeof GenerateTopicsBodySchema>;
