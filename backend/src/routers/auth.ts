import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { signup, login, getMe } from '../modules/auth/index.js';
import {
    LoginBodySchema,
    SignupBodySchema,
    AuthResponseSchema,
    StudentSchema
} from '../modules/auth/types.js';

const router = new OpenAPIHono();

router.openapi(
    createRoute({
        method: 'post',
        path: '/auth/signup',
        request: {
            body: {
                content: { 'application/json': { schema: SignupBodySchema } },
                required: true
            }
        },
        responses: {
            201: {
                content: { 'application/json': { schema: AuthResponseSchema } },
                description: 'Student created'
            },
            409: {
                content: { 'application/json': { schema: z.object({ error: z.string() }) } },
                description: 'Username already taken'
            }
        }
    }),
    async (c) => {
        const { username, grade_level, country } = c.req.valid('json');
        const student_id = await signup(username, grade_level, country);
        if (!student_id) return c.json({ error: 'Username already taken' }, 409);
        return c.json({ student_id }, 201);
    }
);

router.openapi(
    createRoute({
        method: 'get',
        path: '/auth/me',
        request: {
            query: z.object({ student_id: z.string().uuid() })
        },
        responses: {
            200: {
                content: { 'application/json': { schema: StudentSchema } },
                description: 'Student info'
            },
            404: {
                content: { 'application/json': { schema: z.object({ error: z.string() }) } },
                description: 'Student not found'
            }
        }
    }),
    async (c) => {
        const { student_id } = c.req.valid('query');
        const student = await getMe(student_id);
        if (!student) return c.json({ error: 'Student not found' }, 404);
        return c.json(student, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/auth/login',
        request: {
            body: {
                content: { 'application/json': { schema: LoginBodySchema } },
                required: true
            }
        },
        responses: {
            200: {
                content: { 'application/json': { schema: AuthResponseSchema } },
                description: 'Logged in'
            },
            404: {
                content: { 'application/json': { schema: z.object({ error: z.string() }) } },
                description: 'Student not found'
            }
        }
    }),
    async (c) => {
        const { username } = c.req.valid('json');
        const student_id = await login(username);
        if (!student_id) return c.json({ error: 'Student not found' }, 404);
        return c.json({ student_id }, 200);
    }
);

export default router;
