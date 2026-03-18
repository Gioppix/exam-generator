import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { listQuestions } from '../modules/questions/index.js';
import { QuestionSchema } from '../modules/questions/types.js';
import { generateDataset, listJobs } from '../modules/dataset/jobs.js';
import { JobSchema, GenerateDatasetBodySchema } from '../modules/dataset/types.js';

const router = new OpenAPIHono();

router.openapi(
    createRoute({
        method: 'get',
        path: '/admin/dataset',
        responses: {
            200: {
                content: { 'application/json': { schema: z.array(QuestionSchema) } },
                description: 'List all questions'
            }
        }
    }),
    async (c) => {
        const questions = await listQuestions();
        return c.json(questions, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/admin/dataset/generate',
        request: {
            body: {
                content: { 'application/json': { schema: GenerateDatasetBodySchema } },
                required: true
            }
        },
        responses: {
            202: {
                content: {
                    'application/json': {
                        schema: z.object({ job_id: z.string().uuid() })
                    }
                },
                description: 'Generation job accepted'
            }
        }
    }),
    async (c) => {
        const { prompt } = c.req.valid('json');
        const job_id = await generateDataset(prompt);
        return c.json({ job_id }, 202);
    }
);

router.openapi(
    createRoute({
        method: 'get',
        path: '/admin/dataset/jobs',
        responses: {
            200: {
                content: { 'application/json': { schema: z.array(JobSchema) } },
                description: 'List all generation jobs'
            }
        }
    }),
    async (c) => {
        return c.json(listJobs(), 200);
    }
);

export default router;
