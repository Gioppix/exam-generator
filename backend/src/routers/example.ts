import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { getHello } from '../modules/example/index.js';
import { ExampleSchema } from '../modules/example/types.js';

const router = new OpenAPIHono();

router.openapi(
    createRoute({
        method: 'get',
        path: '/example/hello',
        responses: {
            200: {
                content: {
                    'application/json': { schema: ExampleSchema }
                },
                description: 'Hello world'
            }
        }
    }),
    (c) => {
        return c.json(getHello(), 200);
    }
);

export default router;
