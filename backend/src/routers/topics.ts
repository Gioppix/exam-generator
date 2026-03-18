import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { listTopics, createTopic, deleteTopic, generateTopics } from '../modules/topics/index.js';
import {
    TopicSchema,
    CreateTopicBodySchema,
    GenerateTopicsBodySchema
} from '../modules/topics/types.js';

const router = new OpenAPIHono();

router.openapi(
    createRoute({
        method: 'get',
        path: '/admin/topics',
        responses: {
            200: {
                content: { 'application/json': { schema: z.array(TopicSchema) } },
                description: 'List all topics'
            }
        }
    }),
    async (c) => {
        const topics = await listTopics();
        return c.json(topics, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/admin/topics',
        request: {
            body: {
                content: { 'application/json': { schema: CreateTopicBodySchema } },
                required: true
            }
        },
        responses: {
            201: {
                content: { 'application/json': { schema: TopicSchema } },
                description: 'Created topic'
            }
        }
    }),
    async (c) => {
        const body = c.req.valid('json');
        const topic = await createTopic(body);
        return c.json(topic, 201);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/admin/topics/generate',
        request: {
            body: {
                content: { 'application/json': { schema: GenerateTopicsBodySchema } },
                required: true
            }
        },
        responses: {
            204: { description: 'Topics generated and inserted' }
        }
    }),
    async (c) => {
        const { context } = c.req.valid('json');
        await generateTopics(context);
        return c.body(null, 204);
    }
);

router.openapi(
    createRoute({
        method: 'delete',
        path: '/admin/topics/{id}',
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            204: { description: 'Topic deleted' }
        }
    }),
    async (c) => {
        const { id } = c.req.valid('param');
        await deleteTopic(id);
        return c.body(null, 204);
    }
);

export default router;
