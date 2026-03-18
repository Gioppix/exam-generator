import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { generateExam } from '../modules/exams/index.js';
import {
    getExam,
    listExams,
    startExam,
    submitAnswer,
    reportQuestion,
    gradeExam
} from '../modules/exams/db.js';
import {
    CreateExamBodySchema,
    ExamDetailSchema,
    ExamSummarySchema,
    SubmitAnswerBodySchema
} from '../modules/exams/types.js';

const router = new OpenAPIHono();

router.openapi(
    createRoute({
        method: 'post',
        path: '/exams/create',
        request: {
            body: {
                content: { 'application/json': { schema: CreateExamBodySchema } },
                required: true
            }
        },
        responses: {
            201: {
                content: {
                    'application/json': { schema: z.object({ exam_id: z.string().uuid() }) }
                },
                description: 'Exam created'
            }
        }
    }),
    async (c) => {
        const { prompt, student_id } = c.req.valid('json');
        const exam_id = await generateExam(prompt, student_id);
        return c.json({ exam_id }, 201);
    }
);

router.openapi(
    createRoute({
        method: 'get',
        path: '/exams',
        request: {
            query: z.object({ student_id: z.string().uuid() })
        },
        responses: {
            200: {
                content: { 'application/json': { schema: z.array(ExamSummarySchema) } },
                description: 'List exams for student'
            }
        }
    }),
    async (c) => {
        const { student_id } = c.req.valid('query');
        const exams = await listExams(student_id);
        return c.json(exams, 200);
    }
);

router.openapi(
    createRoute({
        method: 'get',
        path: '/exams/{id}',
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            200: {
                content: { 'application/json': { schema: ExamDetailSchema } },
                description: 'Exam detail'
            },
            404: {
                content: { 'application/json': { schema: z.object({ error: z.string() }) } },
                description: 'Exam not found'
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid('param');
        const exam = await getExam(id);
        if (!exam) return c.json({ error: 'Exam not found' }, 404);
        return c.json(exam, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/exams/{id}/start',
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            200: {
                content: { 'application/json': { schema: ExamDetailSchema } },
                description: 'Exam started'
            },
            404: {
                content: { 'application/json': { schema: z.object({ error: z.string() }) } },
                description: 'Exam not found'
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid('param');
        await startExam(id);
        const exam = await getExam(id);
        if (!exam) return c.json({ error: 'Exam not found' }, 404);
        return c.json(exam, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/exams/{id}/submit-answer/{questionId}',
        request: {
            params: z.object({ id: z.string().uuid(), questionId: z.string().uuid() }),
            body: {
                content: { 'application/json': { schema: SubmitAnswerBodySchema } },
                required: true
            }
        },
        responses: {
            200: {
                content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
                description: 'Answer submitted'
            }
        }
    }),
    async (c) => {
        const { id, questionId } = c.req.valid('param');
        const { answer } = c.req.valid('json');
        await submitAnswer(id, questionId, answer);
        return c.json({ ok: true }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/exams/{id}/report/{questionId}',
        request: {
            params: z.object({ id: z.string().uuid(), questionId: z.string().uuid() })
        },
        responses: {
            200: {
                content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
                description: 'Question reported'
            }
        }
    }),
    async (c) => {
        const { id, questionId } = c.req.valid('param');
        await reportQuestion(id, questionId);
        return c.json({ ok: true }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/exams/{id}/grade',
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            200: {
                content: { 'application/json': { schema: ExamDetailSchema } },
                description: 'Exam submitted'
            },
            404: {
                content: { 'application/json': { schema: z.object({ error: z.string() }) } },
                description: 'Exam not found'
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid('param');
        await gradeExam(id);
        const exam = await getExam(id);
        if (!exam) return c.json({ error: 'Exam not found' }, 404);
        return c.json(exam, 200);
    }
);

export default router;
