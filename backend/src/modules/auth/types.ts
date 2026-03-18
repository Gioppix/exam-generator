import { z } from 'zod';

export const AuthBodySchema = z.object({
    username: z.string().min(1)
});

export type AuthBody = z.infer<typeof AuthBodySchema>;

export const AuthResponseSchema = z.object({
    student_id: z.string().uuid()
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
