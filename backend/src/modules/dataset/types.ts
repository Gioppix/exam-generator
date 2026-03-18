import { z } from 'zod';

export const JobStatusSchema = z.enum(['running', 'done', 'error']);

export const JobSchema = z.object({
    job_id: z.string().uuid(),
    status: JobStatusSchema,
    prompt: z.string(),
    created_at: z.string(),
    total: z.number(),
    completed: z.number(),
    error: z.string().optional()
});

export type Job = z.infer<typeof JobSchema>;

export const GenerateDatasetBodySchema = z.object({
    prompt: z.string().min(1)
});

export type GenerateDatasetBody = z.infer<typeof GenerateDatasetBodySchema>;
