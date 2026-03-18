import { z } from 'zod';

export const LoginBodySchema = z.object({
    username: z.string().min(1)
});

export type LoginBody = z.infer<typeof LoginBodySchema>;

export const SignupBodySchema = z.object({
    username: z.string().min(1),
    grade_level: z.string().optional(),
    country: z.string().optional()
});

export type SignupBody = z.infer<typeof SignupBodySchema>;

export const AuthResponseSchema = z.object({
    student_id: z.string().uuid()
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const StudentSchema = z.object({
    student_id: z.string().uuid(),
    username: z.string(),
    grade_level: z.string().nullable(),
    country: z.string().nullable()
});

export type Student = z.infer<typeof StudentSchema>;
