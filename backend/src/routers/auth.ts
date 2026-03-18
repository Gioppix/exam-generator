import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { signup, login } from '../modules/auth/index.js';
import { AuthBodySchema, AuthResponseSchema } from '../modules/auth/types.js';

const router = new OpenAPIHono();

router.openapi(
    createRoute({
        method: 'post',
        path: '/auth/signup',
        request: {
            body: {
                content: { 'application/json': { schema: AuthBodySchema } },
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
        const { username } = c.req.valid('json');
        const student_id = await signup(username);
        if (!student_id) return c.json({ error: 'Username already taken' }, 409);
        return c.json({ student_id }, 201);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/auth/login',
        request: {
            body: {
                content: { 'application/json': { schema: AuthBodySchema } },
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
